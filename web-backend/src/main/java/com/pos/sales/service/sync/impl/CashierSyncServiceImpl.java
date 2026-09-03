package com.pos.sales.service.sync.impl;

import com.pos.catalog.dto.category.CategoryResponse;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.sales.dto.sale.CreateSaleRequest;
import com.pos.sales.dto.sale.SaleItemRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.sales.dto.sync.CashierSyncBootstrapResponse;
import com.pos.sales.dto.sync.OfflineSaleSyncItem;
import com.pos.sales.dto.sync.OfflineSaleSyncResult;
import com.pos.sales.dto.sync.OfflineSalesBatchRequest;
import com.pos.sales.dto.sync.OfflineSalesBatchResponse;
import com.pos.domain.StockMovementType;
import com.pos.sales.entity.CashierShift;
import com.pos.crm.entity.Customer;
import com.pos.catalog.entity.Product;
import com.pos.sales.entity.Sale;
import com.pos.sales.entity.SaleItem;
import com.pos.inventory.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.sales.service.sale.support.CreditSaleCustomerSupport;
import com.pos.catalog.repository.ProductRepository;
import com.pos.sales.repository.SaleRepository;
import com.pos.inventory.service.stock.support.StockMovementPersistence;
import com.pos.repository.UserRepository;
import com.pos.catalog.service.CategoryService;
import com.pos.integrations.finance.service.FinanceAdvanceSaleIntegrationService;
import com.pos.service.event.PosDomainEventService;
import com.pos.integrations.finance.service.FinanceCreditSaleIntegrationService;
import com.pos.integrations.finance.service.FinanceSaleIntegrationService;
import com.pos.catalog.service.product.ProductQueryService;
import com.pos.sales.service.sale.support.CheckoutQuantityResolver;
import com.pos.sales.service.sale.support.SaleEnumParser;
import com.pos.sales.service.sale.support.SaleFiscalApplier;
import com.pos.sales.service.sale.support.SalePaymentResolver;
import com.pos.sales.service.sale.support.SaleReceiptNumberGenerator;
import com.pos.sales.service.salesledger.SalesLedgerCacheService;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.service.support.CashierSaleSupport;
import com.pos.sales.service.sync.CashierSyncService;
import com.pos.shared.log.LogUtil;
import com.pos.util.MoneyCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CashierSyncServiceImpl implements CashierSyncService {

    private static final int BOOTSTRAP_PAGE_SIZE = 500;

    private final CategoryService categoryService;
    private final ProductQueryService productQueryService;
    private final UserRepository userRepository;
    private final CashierSaleSupport cashierSaleSupport;
    private final SaleRepository saleRepository;
    private final CashierShiftRepository cashierShiftRepository;
    private final ProductRepository productRepository;
    private final CreditSaleCustomerSupport creditSaleCustomerSupport;
    private final StockMovementPersistence stockMovementPersistence;
    private final SalesLedgerCacheService salesLedgerCacheService;
    private final SalePaymentResolver paymentResolver;
    private final SaleReceiptNumberGenerator receiptNumberGenerator;
    private final StoreStockService storeStockService;
    private final FinanceCreditSaleIntegrationService financeCreditSaleIntegrationService;
    private final FinanceAdvanceSaleIntegrationService financeAdvanceSaleIntegrationService;
    private final FinanceSaleIntegrationService financeSaleIntegrationService;
    private final CheckoutQuantityResolver checkoutQuantityResolver;
    private final PosDomainEventService posDomainEventService;
    private final SaleFiscalApplier saleFiscalApplier;

    @Override
    @Transactional(readOnly = true)
    public CashierSyncBootstrapResponse bootstrap(Integer storeId, UUID cashierId) {
        User cashier = userRepository.findByIdWithDetails(cashierId)
            .orElseThrow(() -> new ResourceNotFoundException("Cashier not found"));
        Store store = cashierSaleSupport.requireStoreForSale(cashier, storeId);
        assertStoreMatchesCashierCompany(cashier, store);

        List<CategoryResponse> categories = categoryService.findAll(null);
        List<ProductResponse> products = new ArrayList<>();
        int page = 0;
        while (true) {
            PageResponse<ProductResponse> chunk = productQueryService.getProducts(
                null,
                null,
                true,
                "ACTIVE",
                store.getId(),
                null,
                null,
                null,
                null,
                null,
                PageRequest.of(page, BOOTSTRAP_PAGE_SIZE)
            );
            if (chunk.content() == null || chunk.content().isEmpty()) {
                break;
            }
            products.addAll(chunk.content());
            if (page + 1 >= chunk.totalPages()) {
                break;
            }
            page += 1;
        }

        LogUtil.info(
            CashierSyncServiceImpl.class,
            "Offline bootstrap: storeId={}, products={}, categories={}",
            store.getId(),
            products.size(),
            categories.size()
        );

        return new CashierSyncBootstrapResponse(
            store.getId(),
            store.getName(),
            categories,
            products,
            Instant.now()
        );
    }

    @Override
    public OfflineSalesBatchResponse syncSalesBatch(OfflineSalesBatchRequest request, UUID cashierId) {
        List<OfflineSaleSyncResult> results = new ArrayList<>();
        for (OfflineSaleSyncItem item : request.sales()) {
            results.add(syncOneSale(item, cashierId));
        }
        return new OfflineSalesBatchResponse(results);
    }

    private OfflineSaleSyncResult syncOneSale(OfflineSaleSyncItem item, UUID cashierId) {
        try {
            return saleRepository.findByClientSaleId(item.clientSaleId())
                .map(existing -> new OfflineSaleSyncResult(
                    item.clientSaleId(),
                    existing.getId(),
                    existing.getReceiptNumber(),
                    "ALREADY_EXISTS",
                    null
                ))
                .orElseGet(() -> createOfflineSale(item, cashierId));
        } catch (Exception ex) {
            LogUtil.warn(
                CashierSyncServiceImpl.class,
                "Offline sale sync failed clientSaleId={}: {}",
                item.clientSaleId(),
                ex.getMessage()
            );
            return new OfflineSaleSyncResult(
                item.clientSaleId(),
                null,
                null,
                "FAILED",
                ex.getMessage()
            );
        }
    }

    private OfflineSaleSyncResult createOfflineSale(OfflineSaleSyncItem item, UUID cashierId) {
        CreateSaleRequest req = item.sale();
        User cashier = userRepository.findByIdWithDetails(cashierId)
            .orElseThrow(() -> new ResourceNotFoundException("Cashier not found"));
        Store store = cashierSaleSupport.requireStoreForSale(cashier, req.storeId());
        CashierShift shift = resolveShiftForOfflineSync(cashier, store, item.shiftOpenedAt());

        Sale.ReceiptType receiptType = SaleEnumParser.receiptType(req.receiptType());
        Customer customer = creditSaleCustomerSupport.resolveForCheckout(req.customerId(), receiptType);

        List<SaleItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        BigDecimal lineDiscountTotal = BigDecimal.ZERO;
        Set<UUID> productIds = new HashSet<>();
        for (SaleItemRequest itemReq : req.items()) {
            productIds.add(itemReq.productId());
        }
        Map<UUID, Map<String, String>> attributesByProductId = checkoutQuantityResolver.loadAttributes(productIds);

        for (SaleItemRequest itemReq : req.items()) {
            Product product = productRepository.findById(itemReq.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.productId()));
            if (!product.isActive()) {
                throw new BadRequestException("Product is inactive: " + product.getName());
            }
            BigDecimal lineQty = checkoutQuantityResolver.normalizeQuantity(
                product,
                itemReq.quantity(),
                attributesByProductId
            );
            checkoutQuantityResolver.validateQuantity(product, lineQty, attributesByProductId);

            BigDecimal lineDiscount = itemReq.discount() != null ? itemReq.discount() : BigDecimal.ZERO;
            BigDecimal unitPrice = resolveCheckoutUnitPrice(itemReq, product, store.getId());
            BigDecimal lineGross = MoneyCalculator.lineGross(unitPrice, lineQty, lineDiscount);
            BigDecimal rate = product.getTaxRate() != null ? product.getTaxRate() : new BigDecimal("12");
            BigDecimal taxAmt = MoneyCalculator.vatFromInclusiveLine(lineGross, rate);
            BigDecimal netLine = lineGross.subtract(taxAmt);

            SaleItem saleItem = SaleItem.builder()
                .product(product)
                .productName(product.getName())
                .unitPrice(unitPrice)
                .quantity(lineQty)
                .discount(lineDiscount)
                .taxAmount(taxAmt)
                .lineTotal(lineGross)
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
        BigDecimal orderDiscountPercent = resolveOrderDiscountPercent(
            req.orderDiscountPercent(),
            orderDiscount,
            grossTotal
        );
        BigDecimal total = grossTotal.subtract(orderDiscount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountTotal = lineDiscountTotal.add(orderDiscount).setScale(2, RoundingMode.HALF_UP);
        lineDiscountTotal = lineDiscountTotal.setScale(2, RoundingMode.HALF_UP);

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
            amounts = paymentResolver.resolve(paymentMethod, total, req);
            if (paymentMethod == Sale.PaymentMethod.CARD && cardType == null) {
                cardType = Sale.CardType.HUMO;
            } else if (amounts.card().signum() > 0 && cardType == null) {
                cardType = Sale.CardType.HUMO;
            }
        }

        String notes = req.notes();
        if (notes == null || notes.isBlank()) {
            notes = "OFFLINE_SYNC";
        } else if (!notes.contains("OFFLINE_SYNC")) {
            notes = notes + " | OFFLINE_SYNC";
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
            .receiptType(receiptType)
            .cardType(cardType)
            .amountTendered(amounts.tendered())
            .changeGiven(amounts.change())
            .status(Sale.SaleStatus.COMPLETED)
            .notes(notes)
            .clientSaleId(item.clientSaleId())
            .offlineDeviceId(item.offlineDeviceId())
            .saleSource(Sale.SaleSource.OFFLINE_SYNC)
            .createdAt(item.createdAt() != null ? item.createdAt() : Instant.now())
            .build();

        items.forEach(saleItem -> saleItem.setSale(sale));
        sale.setItems(items);
        saleFiscalApplier.apply(sale, shift, req.fiscal(), false);

        Sale saved = saleRepository.save(sale);
        if (saved.getReceiptType() != Sale.ReceiptType.ADVANCE) {
            for (SaleItem saleItem : saved.getItems()) {
                stockMovementPersistence.save(StockMovement.builder()
                    .product(saleItem.getProduct())
                    .store(store)
                    .movementType(StockMovementType.SALE)
                    .quantity(saleItem.getQuantity().negate())
                    .referenceId(saved.getId())
                    .createdBy(cashier)
                    .notes("Продажа " + saved.getReceiptNumber() + " (offline sync)")
                    .build());
            }
        }
        salesLedgerCacheService.onSaleChanged(saved);
        if (saved.getReceiptType() == Sale.ReceiptType.CREDIT) {
            financeCreditSaleIntegrationService.onCreditSaleCompleted(saved);
        } else if (saved.getReceiptType() == Sale.ReceiptType.ADVANCE) {
            financeAdvanceSaleIntegrationService.onAdvanceSaleCompleted(saved);
        } else {
            financeSaleIntegrationService.onSaleCompleted(saved);
        }
        posDomainEventService.publishSaleCompletedAfterCommit(saved);
        LogUtil.info(
            CashierSyncServiceImpl.class,
            "Offline sale synced: clientSaleId={}, receipt={}",
            item.clientSaleId(),
            saved.getReceiptNumber()
        );
        return new OfflineSaleSyncResult(
            item.clientSaleId(),
            saved.getId(),
            saved.getReceiptNumber(),
            "CREATED",
            null
        );
    }

    private void assertStoreMatchesCashierCompany(User cashier, Store store) {
        if (cashier.getCompany() == null || store.getCompany() == null) {
            return;
        }
        if (!cashier.getCompany().getId().equals(store.getCompany().getId())) {
            throw new BadRequestException("Store does not belong to cashier company");
        }
    }

    private CashierShift resolveShiftForOfflineSync(User cashier, Store store, Instant shiftOpenedAt) {
        return cashierShiftRepository
            .findByCashierIdAndStoreIdAndStatus(cashier.getId(), store.getId(), CashierShift.ShiftStatus.OPEN)
            .orElseGet(() -> {
                Instant opened = shiftOpenedAt != null ? shiftOpenedAt : Instant.now();
                CashierShift shift = CashierShift.builder()
                    .cashier(cashier)
                    .store(store)
                    .status(CashierShift.ShiftStatus.OPEN)
                    .openedAt(opened)
                    .periodStartedAt(opened)
                    .saleCount(0)
                    .totalAmount(BigDecimal.ZERO)
                    .cashAmount(BigDecimal.ZERO)
                    .cardAmount(BigDecimal.ZERO)
                    .vatAmount(BigDecimal.ZERO)
                    .build();
                return cashierShiftRepository.save(shift);
            });
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
