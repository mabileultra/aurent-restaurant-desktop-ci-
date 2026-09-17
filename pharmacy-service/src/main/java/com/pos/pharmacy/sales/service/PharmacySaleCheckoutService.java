package com.pos.pharmacy.sales.service;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.integration.dto.CashierShiftSnapshot;
import com.pos.pharmacy.revenue.service.PharmacyRevenuePublicationService;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.dto.SaleItemRequest;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.entity.SaleItem;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.support.*;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import com.pos.pharmacy.shift.support.PharmacyShiftLookup;
import com.pos.pharmacy.shift.support.PharmacyShiftSaleAccumulator;
import com.pos.pharmacy.util.MoneyCalculator;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import com.pos.pharmacy.warehouse.support.PharmacyLotFefoSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class PharmacySaleCheckoutService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final PharmacyShiftLookup shiftLookup;
    private final PharmacyShiftSaleAccumulator shiftSaleAccumulator;
    private final SalePaymentResolver paymentResolver;
    private final SaleReceiptNumberGenerator receiptNumberGenerator;
    private final StoreStockService storeStockService;
    private final PharmacyLotFefoSupport pharmacyLotFefoSupport;
    private final CheckoutQuantityResolver checkoutQuantityResolver;
    private final SaleFiscalApplier saleFiscalApplier;
    private final PharmacySalePatientSupport pharmacySalePatientSupport;
    private final SaleMapper saleMapper;
    private final PharmacyRevenuePublicationService revenuePublicationService;

    public SaleResponse processSale(CreateSaleRequest req, UUID cashierId) {
        return processSale(req, cashierId, null);
    }

    public SaleResponse processSale(CreateSaleRequest req, UUID cashierId, OfflineSaleContext offline) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null) {
            throw PharmacyErrors.badRequest("Компания не определена");
        }
        if (req.storeId() == null) {
            throw PharmacyErrors.badRequest("Укажите магазин");
        }
        PharmacyCashierShift openShift = shiftLookup.requireOpen(req.storeId());
        CashierShiftSnapshot shift = shiftLookup.toSnapshot(openShift);
        SaleEnums.ReceiptType receiptType = SaleEnumParser.receiptType(req.receiptType());
        if (receiptType != SaleEnums.ReceiptType.SALE) {
            throw PharmacyErrors.badRequest("Аптека поддерживает только обычную продажу");
        }

        Map<UUID, Product> productsById = loadProducts(companyId, req.items());
        Map<UUID, Map<String, String>> attributesByProductId = checkoutQuantityResolver.loadAttributes(req.items());

        List<SaleItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        BigDecimal lineDiscountTotal = BigDecimal.ZERO;

        for (SaleItemRequest itemReq : req.items()) {
            Product product = productsById.get(itemReq.productId());
            if (product == null) {
                throw PharmacyErrors.notFound("Product", itemReq.productId());
            }
            BigDecimal lineQty = checkoutQuantityResolver.normalizeQuantity(product, itemReq.quantity(), attributesByProductId);
            checkoutQuantityResolver.validateQuantity(product, lineQty, attributesByProductId);
            storeStockService.requireAvailable(product, req.storeId(), lineQty);

            BigDecimal lineDiscount = itemReq.discount() != null ? itemReq.discount() : BigDecimal.ZERO;
            BigDecimal unitPrice = resolveCheckoutUnitPrice(itemReq, product);
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

            storeStockService.decrease(product, req.storeId(), lineQty);
            pharmacyLotFefoSupport.decreaseForSale(product, req.storeId(), lineQty, saleItem);
        }

        BigDecimal grossTotal = subtotal.add(taxTotal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal orderDiscount = normalizeOrderDiscount(req.orderDiscountAmount(), grossTotal);
        BigDecimal orderDiscountPercent = resolveOrderDiscountPercent(req.orderDiscountPercent(), orderDiscount, grossTotal);
        BigDecimal total = grossTotal.subtract(orderDiscount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountTotal = lineDiscountTotal.add(orderDiscount).setScale(2, RoundingMode.HALF_UP);
        lineDiscountTotal = lineDiscountTotal.setScale(2, RoundingMode.HALF_UP);

        SaleEnums.PaymentMethod paymentMethod = SaleEnumParser.paymentMethod(req.paymentMethod());
        SaleEnums.CardType cardType = SaleEnumParser.cardType(req.cardType());
        SalePaymentResolver.PaymentAmounts amounts = paymentResolver.resolve(paymentMethod, total, req);
        validatePaymentTotals(total, amounts);
        if (paymentMethod == SaleEnums.PaymentMethod.CASHLESS) {
            cardType = null;
        } else if (paymentMethod == SaleEnums.PaymentMethod.CARD && cardType == null) {
            cardType = SaleEnums.CardType.HUMO;
        } else if (amounts.card().signum() > 0 && cardType == null) {
            cardType = SaleEnums.CardType.HUMO;
        }

        String notes = req.notes();
        if (offline != null) {
            if (notes == null || notes.isBlank()) {
                notes = "OFFLINE_SYNC";
            } else if (!notes.contains("OFFLINE_SYNC")) {
                notes = notes + " | OFFLINE_SYNC";
            }
        }

        Sale.SaleBuilder saleBuilder = Sale.builder()
            .companyId(companyId)
            .receiptNumber(receiptNumberGenerator.next())
            .cashierId(cashierId)
            .cashierName(shift.cashierName())
            .storeId(req.storeId())
            .cashierShiftId(shift.id())
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
            .status(SaleEnums.SaleStatus.COMPLETED)
            .notes(notes)
            .patientPinfl(pharmacySalePatientSupport.normalizePinfl(req.patientPinfl()))
            .loyaltyPhone(pharmacySalePatientSupport.normalizeLoyaltyPhone(req.loyaltyPhone()))
            .pharmacyDmed(Boolean.TRUE.equals(req.pharmacyDmed()))
            .printFiscalQr(req.printFiscalQr() == null || Boolean.TRUE.equals(req.printFiscalQr()));

        if (offline != null) {
            saleBuilder
                .clientSaleId(offline.clientSaleId())
                .offlineDeviceId(offline.offlineDeviceId())
                .createdAt(offline.createdAt() != null ? offline.createdAt() : Instant.now());
        }

        Sale sale = saleBuilder.build();

        items.forEach(item -> item.setSale(sale));
        sale.setItems(items);
        saleFiscalApplier.apply(sale, req.fiscal());

        Sale saved = saleRepository.save(sale);
        shiftSaleAccumulator.applySale(
            openShift,
            saved.getTotalAmount(),
            saved.getCashAmount(),
            saved.getCardAmount(),
            saved.getTaxTotal(),
            paymentMethod
        );
        revenuePublicationService.onSaleCompleted(saved, attributesByProductId, shift.storeName());
        return saleMapper.toResponse(
            saved,
            shift.storeName(),
            shift.status(),
            openShift.getOpenedAt(),
            openShift.getClosedAt(),
            null
        );
    }

    private Map<UUID, Product> loadProducts(Integer companyId, List<SaleItemRequest> items) {
        Set<UUID> ids = new HashSet<>();
        for (SaleItemRequest item : items) {
            ids.add(item.productId());
        }
        Map<UUID, Product> result = new HashMap<>();
        for (Product product : productRepository.findAllById(ids)) {
            if (!companyId.equals(product.getCompanyId())) {
                throw PharmacyErrors.badRequest("Товар не принадлежит компании");
            }
            result.put(product.getId(), product);
        }
        if (result.size() != ids.size()) {
            throw PharmacyErrors.badRequest("Один или несколько товаров не найдены");
        }
        return result;
    }

    private BigDecimal resolveCheckoutUnitPrice(SaleItemRequest itemReq, Product product) {
        if (itemReq.unitPrice() != null && itemReq.unitPrice().signum() > 0) {
            return itemReq.unitPrice().setScale(2, RoundingMode.HALF_UP);
        }
        return product.getSellingPrice().setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal normalizeOrderDiscount(BigDecimal amount, BigDecimal grossTotal) {
        if (amount == null || amount.signum() <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return amount.min(grossTotal.max(BigDecimal.ZERO)).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private static void validatePaymentTotals(BigDecimal total, SalePaymentResolver.PaymentAmounts amounts) {
        BigDecimal paid = amounts.cash().add(amounts.card()).setScale(2, RoundingMode.HALF_UP);
        if (paid.compareTo(total) != 0) {
            throw PharmacyErrors.badRequest("Сумма оплаты не совпадает с итогом чека");
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
        return orderDiscount.multiply(new BigDecimal("100")).divide(grossTotal, 2, RoundingMode.HALF_UP);
    }
}
