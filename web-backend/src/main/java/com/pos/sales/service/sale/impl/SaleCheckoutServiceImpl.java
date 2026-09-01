package com.pos.sales.service.sale.impl;

import com.pos.sales.dto.sale.CreateSaleRequest;
import com.pos.sales.dto.sale.SaleItemRequest;
import com.pos.sales.dto.sale.SaleResponse;
import com.pos.sales.entity.CashierShift;
import com.pos.crm.entity.Customer;
import com.pos.catalog.entity.Product;
import com.pos.sales.entity.Sale;
import com.pos.sales.entity.SaleItem;
import com.pos.domain.StockMovementType;
import com.pos.inventory.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.sales.mapper.SaleMapper;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.sales.service.sale.support.CheckoutQuantityResolver;
import com.pos.sales.service.sale.support.CreditSaleCustomerSupport;
import com.pos.sales.repository.SaleRepository;
import com.pos.inventory.service.stock.support.StockMovementPersistence;
import com.pos.repository.UserRepository;
import com.pos.sales.service.sale.SaleCheckoutService;
import com.pos.sales.service.sale.support.CheckoutProductLoader;
import com.pos.sales.service.sale.support.SaleEnumParser;
import com.pos.sales.service.sale.support.SalePaymentResolver;
import com.pos.sales.service.sale.support.SaleReceiptNumberGenerator;
import com.pos.sales.service.sale.support.SaleVatCalculator;
import com.pos.service.event.PosDomainEventService;
import com.pos.integrations.finance.service.FinanceAdvancePaymentIntegrationService;
import com.pos.integrations.finance.service.FinanceAdvanceSaleIntegrationService;
import com.pos.integrations.finance.service.FinanceCreditSaleIntegrationService;
import com.pos.integrations.finance.service.FinanceSaleIntegrationService;
import com.pos.sales.service.salesledger.SalesLedgerCacheService;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import com.pos.util.MoneyCalculator;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SaleCheckoutServiceImpl implements SaleCheckoutService {

    private final SaleRepository saleRepository;
    private final CashierShiftRepository cashierShiftRepository;
    private final UserRepository userRepository;
    private final CreditSaleCustomerSupport creditSaleCustomerSupport;
    private final StockMovementPersistence stockMovementPersistence;
    private final CashierSaleSupport cashierSaleSupport;
    private final SaleMapper saleMapper;
    private final SalesLedgerCacheService salesLedgerCacheService;
    private final SalePaymentResolver paymentResolver;
    private final SaleReceiptNumberGenerator receiptNumberGenerator;
    private final StoreStockService storeStockService;
    private final TenantAccessSupport tenantAccess;
    private final CheckoutProductLoader checkoutProductLoader;
    private final FinanceCreditSaleIntegrationService financeCreditSaleIntegrationService;
    private final FinanceAdvanceSaleIntegrationService financeAdvanceSaleIntegrationService;
    private final FinanceAdvancePaymentIntegrationService financeAdvancePaymentIntegrationService;
    private final FinanceSaleIntegrationService financeSaleIntegrationService;
    private final CheckoutQuantityResolver checkoutQuantityResolver;
    private final PosDomainEventService posDomainEventService;

    @Override
    public SaleResponse processSale(CreateSaleRequest req, UUID cashierId) {
        User cashier = userRepository.findByIdWithDetails(cashierId)
            .orElseThrow(() -> PosExceptions.notFound("Cashier"));

        Store store = cashierSaleSupport.requireStoreForSale(cashier, req.storeId());

        CashierShift shift = cashierShiftRepository
            .findByCashierIdAndStoreIdAndStatus(cashier.getId(), store.getId(), CashierShift.ShiftStatus.OPEN)
            .orElseThrow(() -> PosExceptions.badRequest("Смена не открыта. Откройте смену перед продажей."));

        Sale.ReceiptType receiptType = SaleEnumParser.receiptType(req.receiptType());
        Customer customer = creditSaleCustomerSupport.resolveForCheckout(req.customerId(), receiptType);

        Map<UUID, Product> productsById = checkoutProductLoader.loadIndexed(req.items());
        Set<UUID> productIds = new HashSet<>(productsById.keySet());
        Map<UUID, Map<String, String>> attributesByProductId = checkoutQuantityResolver.loadAttributes(productIds);

        List<SaleItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        BigDecimal lineDiscountTotal = BigDecimal.ZERO;

        for (SaleItemRequest itemReq : req.items()) {
            Product product = productsById.get(itemReq.productId());
            BigDecimal lineQty = checkoutQuantityResolver.normalizeQuantity(product, itemReq.quantity(), attributesByProductId);
            checkoutQuantityResolver.validateQuantity(product, lineQty, attributesByProductId);
            if (receiptType != Sale.ReceiptType.ADVANCE) {
                storeStockService.requireAvailable(product, store, lineQty);
            }

            BigDecimal lineDiscount = itemReq.discount() != null ? itemReq.discount() : BigDecimal.ZERO;
            BigDecimal unitPrice = resolveCheckoutUnitPrice(itemReq, product, store.getId());
            BigDecimal lineGross = MoneyCalculator.lineGross(unitPrice, lineQty, lineDiscount);
            BigDecimal rate = product.getTaxRate() != null ? product.getTaxRate() : new BigDecimal("12");
            BigDecimal taxAmt = MoneyCalculator.vatFromInclusiveLine(lineGross, rate);
            BigDecimal netLine = lineGross.subtract(taxAmt);
            BigDecimal lineTotal = lineGross;

            SaleItem saleItem = SaleItem.builder()
                .product(product)
                .productName(product.getName())
                .unitPrice(unitPrice)
                .quantity(lineQty)
                .discount(lineDiscount)
                .taxAmount(taxAmt)
                .lineTotal(lineTotal)
                .build();

            items.add(saleItem);

            subtotal = subtotal.add(netLine);
            taxTotal = taxTotal.add(taxAmt);
            lineDiscountTotal = lineDiscountTotal.add(lineDiscount);

            if (receiptType != Sale.ReceiptType.ADVANCE) {
                storeStockService.decrease(product, store, lineQty);
            }
        }

        BigDecimal grossTotal = subtotal.add(taxTotal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal orderDiscount = normalizeOrderDiscount(req.orderDiscountAmount(), grossTotal);
        BigDecimal orderDiscountPercent = resolveOrderDiscountPercent(req.orderDiscountPercent(), orderDiscount, grossTotal);
        BigDecimal total = grossTotal.subtract(orderDiscount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountTotal = lineDiscountTotal.add(orderDiscount).setScale(2, RoundingMode.HALF_UP);
        lineDiscountTotal = lineDiscountTotal.setScale(2, RoundingMode.HALF_UP);

        BigDecimal advanceAmount = normalizeAdvanceAmount(req.advanceAmount(), receiptType, customer, total);

        Sale.CardType cardType = SaleEnumParser.cardType(req.cardType());
        Sale.PaymentMethod paymentMethod = Sale.PaymentMethod.valueOf(req.paymentMethod());
        SalePaymentResolver.PaymentAmounts amounts;
        if (receiptType == Sale.ReceiptType.CREDIT) {
            amounts = new SalePaymentResolver.PaymentAmounts(
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
            );
            cardType = null;
        } else {
            BigDecimal payable = total.subtract(advanceAmount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            amounts = paymentResolver.resolve(paymentMethod, payable, req);
            validatePaymentTotals(total, advanceAmount, amounts);
            if (paymentMethod == Sale.PaymentMethod.CASHLESS) {
                cardType = null;
            } else if (paymentMethod == Sale.PaymentMethod.CARD && cardType == null) {
                cardType = Sale.CardType.HUMO;
            } else if (amounts.card().signum() > 0 && cardType == null) {
                cardType = Sale.CardType.HUMO;
            }
        }

        Sale sale = Sale.builder()
            .receiptNumber(receiptNumberGenerator.next())
            .cashier(cashier)
            .store(store)
            .customer(customer)
            .cashierShift(shift)
            .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
            .taxTotal(taxTotal.setScale(2, RoundingMode.HALF_UP))
            .discountTotal(discountTotal)
            .lineDiscountTotal(lineDiscountTotal)
            .orderDiscountAmount(orderDiscount)
            .orderDiscountPercent(orderDiscountPercent)
            .totalAmount(total)
            .paymentMethod(paymentMethod)
            .cashAmount(amounts.cash())
            .cardAmount(amounts.card())
            .advanceAmount(advanceAmount)
            .receiptType(receiptType)
            .cardType(cardType)
            .amountTendered(amounts.tendered())
            .changeGiven(amounts.change())
            .status(Sale.SaleStatus.COMPLETED)
            .notes(req.notes())
            .build();

        items.forEach(item -> item.setSale(sale));
        sale.setItems(items);

        Sale saved = saleRepository.save(sale);
        if (saved.getReceiptType() != Sale.ReceiptType.ADVANCE) {
            for (SaleItem item : saved.getItems()) {
                stockMovementPersistence.save(StockMovement.builder()
                    .product(item.getProduct())
                    .store(store)
                    .movementType(StockMovementType.SALE)
                    .quantity(item.getQuantity().negate())
                    .referenceId(saved.getId())
                    .createdBy(cashier)
                    .notes("Продажа " + saved.getReceiptNumber())
                    .build());
            }
        }
        salesLedgerCacheService.onSaleChanged(saved);
        if (saved.getReceiptType() == Sale.ReceiptType.CREDIT) {
            financeCreditSaleIntegrationService.onCreditSaleCompleted(saved);
        } else if (saved.getReceiptType() == Sale.ReceiptType.ADVANCE) {
            financeAdvanceSaleIntegrationService.onAdvanceSaleCompleted(saved);
        } else if (saved.getAdvanceAmount() != null && saved.getAdvanceAmount().signum() > 0) {
            financeAdvancePaymentIntegrationService.onSaleAdvanceApplied(saved);
        } else {
            financeSaleIntegrationService.onSaleCompleted(saved);
        }
        posDomainEventService.publishSaleCompletedAfterCommit(saved);
        LogUtil.info(SaleCheckoutServiceImpl.class, "Sale completed: id={}, receipt={}", saved.getId(), saved.getReceiptNumber());
        return saleMapper.toResponse(saved);
    }

    private BigDecimal resolveCheckoutUnitPrice(SaleItemRequest itemReq, Product product, Integer storeId) {
        if (itemReq.unitPrice() != null && itemReq.unitPrice().signum() > 0) {
            return itemReq.unitPrice().setScale(2, RoundingMode.HALF_UP);
        }
        return cashierSaleSupport.resolveUnitPrice(product, storeId);
    }

    private static BigDecimal normalizeOrderDiscount(BigDecimal amount, BigDecimal grossTotal) {
        if (amount == null || amount.signum() <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal capped = amount.min(grossTotal.max(BigDecimal.ZERO));
        return capped.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal normalizeAdvanceAmount(
        BigDecimal amount,
        Sale.ReceiptType receiptType,
        Customer customer,
        BigDecimal total
    ) {
        if (amount == null || amount.signum() <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (receiptType != Sale.ReceiptType.SALE) {
            throw PosExceptions.badRequest("Аванс доступен только для обычной продажи");
        }
        if (customer == null) {
            throw PosExceptions.badRequest("Для оплаты авансом укажите покупателя");
        }
        BigDecimal normalized = amount.setScale(2, RoundingMode.HALF_UP);
        if (normalized.compareTo(total) > 0) {
            throw PosExceptions.badRequest("Сумма аванса больше суммы чека");
        }
        return normalized;
    }

    private static void validatePaymentTotals(
        BigDecimal total,
        BigDecimal advanceAmount,
        SalePaymentResolver.PaymentAmounts amounts
    ) {
        BigDecimal paid = advanceAmount
            .add(amounts.cash())
            .add(amounts.card())
            .setScale(2, RoundingMode.HALF_UP);
        if (paid.compareTo(total) != 0) {
            throw PosExceptions.badRequest("Сумма оплаты не совпадает с итогом чека");
        }
    }

    private static BigDecimal resolveOrderDiscountPercent(
        BigDecimal requestedPercent,
        BigDecimal orderDiscount,
        BigDecimal grossTotal
    ) {
        if (orderDiscount.signum() <= 0) {
            return null;
        }
        if (requestedPercent != null && requestedPercent.signum() > 0) {
            return requestedPercent.min(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
        }
        if (grossTotal.signum() <= 0) {
            return null;
        }
        return orderDiscount
            .multiply(new BigDecimal("100"))
            .divide(grossTotal, 2, RoundingMode.HALF_UP);
    }
}
