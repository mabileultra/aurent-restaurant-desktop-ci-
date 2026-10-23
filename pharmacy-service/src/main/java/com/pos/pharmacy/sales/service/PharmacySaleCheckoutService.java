package com.pos.pharmacy.sales.service;

import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCatalogErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCommonErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.integration.dto.CashierShiftSnapshot;
import com.pos.pharmacy.marks.service.PharmacyMarkWithdrawService;
import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
import com.pos.pharmacy.revenue.service.PharmacyRevenuePublicationService;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.dto.SaleItemRequest;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.entity.SaleItem;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.support.CheckoutLineAssembler;
import com.pos.pharmacy.sales.support.CheckoutMarkGuard;
import com.pos.pharmacy.sales.support.CheckoutOrderPricing;
import com.pos.pharmacy.sales.support.CheckoutQuantityResolver;
import com.pos.pharmacy.sales.support.CheckoutSaleFactory;
import com.pos.pharmacy.sales.support.OfflineSaleContext;
import com.pos.pharmacy.sales.support.SaleEnumParser;
import com.pos.pharmacy.sales.support.SaleFiscalApplier;
import com.pos.pharmacy.sales.support.SaleMapper;
import com.pos.pharmacy.sales.support.SalePaymentResolver;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import com.pos.pharmacy.shift.support.PharmacyShiftLookup;
import com.pos.pharmacy.shift.support.PharmacyShiftSaleAccumulator;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import com.pos.pharmacy.warehouse.support.PharmacyLotFefoSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PharmacySaleCheckoutService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final PharmacyShiftLookup shiftLookup;
    private final PharmacyShiftSaleAccumulator shiftSaleAccumulator;
    private final SalePaymentResolver paymentResolver;
    private final StoreStockService storeStockService;
    private final PharmacyLotFefoSupport pharmacyLotFefoSupport;
    private final CheckoutQuantityResolver checkoutQuantityResolver;
    private final CheckoutMarkGuard checkoutMarkGuard;
    private final CheckoutLineAssembler checkoutLineAssembler;
    private final CheckoutSaleFactory checkoutSaleFactory;
    private final SaleFiscalApplier saleFiscalApplier;
    private final SaleMapper saleMapper;
    private final PharmacyRevenuePublicationService revenuePublicationService;
    private final PharmacySoldMarkService soldMarkService;
    private final PharmacyStockMarkService stockMarkService;
    private final PharmacyMarkWithdrawService markWithdrawService;
    private final PharmacyCatalogCacheEvictor catalogCacheEvictor;

    public SaleResponse processSale(CreateSaleRequest req, UUID cashierId) {
        return processSale(req, cashierId, null);
    }

    public SaleResponse processSale(CreateSaleRequest req, UUID cashierId, OfflineSaleContext offline) {
        Integer companyId = requireCompanyId();
        Integer storeId = requireStoreId(req);
        PharmacyCashierShift openShift = shiftLookup.requireOpen(storeId);
        CashierShiftSnapshot shift = shiftLookup.toSnapshot(openShift);
        SaleEnums.ReceiptType receiptType = requireSaleReceipt(req.receiptType());

        CheckoutMarkGuard.MarkPlan markPlan = checkoutMarkGuard.collect(req.items());
        soldMarkService.assertNotSold(companyId, markPlan.allMarks());

        Map<UUID, Product> productsById = loadProducts(companyId, req.items());
        Map<UUID, Map<String, String>> attributesByProductId = checkoutQuantityResolver.loadAttributes(req.items());
        CheckoutLineAssembler.AssembledLines assembled = checkoutLineAssembler.assemble(
            req.items(),
            productsById,
            attributesByProductId
        );

        storeStockService.decreaseAll(storeId, assembled.productsTouched(), assembled.quantityByProductId());
        pharmacyLotFefoSupport.decreaseForSaleBatch(storeId, CheckoutLineAssembler.toLotNeeds(assembled));

        CheckoutTotals totals = resolveTotals(req, assembled);
        SaleEnums.PaymentMethod paymentMethod = SaleEnumParser.paymentMethod(req.paymentMethod());
        SaleEnums.CardType cardType = resolveCardType(
            paymentMethod,
            SaleEnumParser.cardType(req.cardType()),
            totals.amounts()
        );

        Sale sale = checkoutSaleFactory.create(
            companyId,
            cashierId,
            req,
            shift,
            receiptType,
            paymentMethod,
            cardType,
            totals.amounts(),
            assembled,
            totals.lineDiscountTotal(),
            totals.orderDiscount(),
            totals.orderDiscountPercent(),
            totals.discountTotal(),
            totals.total(),
            offline
        );

        List<SaleItem> items = assembled.items();
        items.forEach(item -> item.setSale(sale));
        sale.setItems(items);
        saleFiscalApplier.apply(sale, req.fiscal());

        Sale saved = saleRepository.save(sale);
        soldMarkService.registerSaleMarks(saved, saved.getItems(), markPlan.marksPerItem());
        stockMarkService.markPendingWithdraw(storeId, saved.getId(), markPlan.allMarks());
        if (!markPlan.allMarks().isEmpty()) {
            boolean fiscalOk = SaleFiscalApplier.STATUS_FISCALIZED.equals(saved.getFiscalStatus());
            markWithdrawService.enqueueAfterSale(companyId, storeId, saved.getId(), markPlan.allMarks(), fiscalOk);
        }
        shiftSaleAccumulator.applySale(
            openShift,
            saved.getTotalAmount(),
            saved.getCashAmount(),
            saved.getCardAmount(),
            saved.getTaxTotal(),
            paymentMethod
        );
        revenuePublicationService.onSaleCompleted(saved, attributesByProductId, shift.storeName());
        catalogCacheEvictor.onStoreStockChanged(companyId, storeId);
        return saleMapper.toResponse(
            saved,
            shift.storeName(),
            shift.status(),
            openShift.getOpenedAt(),
            openShift.getClosedAt(),
            null
        );
    }

    private CheckoutTotals resolveTotals(CreateSaleRequest req, CheckoutLineAssembler.AssembledLines assembled) {
        BigDecimal grossTotal = assembled.subtotalNet().add(assembled.taxTotal()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal orderDiscount = CheckoutOrderPricing.normalizeOrderDiscount(req.orderDiscountAmount(), grossTotal);
        BigDecimal orderDiscountPercent = CheckoutOrderPricing.resolveOrderDiscountPercent(
            req.orderDiscountPercent(),
            orderDiscount,
            grossTotal
        );
        BigDecimal total = grossTotal.subtract(orderDiscount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal lineDiscountTotal = assembled.lineDiscountTotal().setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountTotal = lineDiscountTotal.add(orderDiscount).setScale(2, RoundingMode.HALF_UP);
        SaleEnums.PaymentMethod paymentMethod = SaleEnumParser.paymentMethod(req.paymentMethod());
        SalePaymentResolver.PaymentAmounts amounts = paymentResolver.resolve(paymentMethod, total, req);
        CheckoutOrderPricing.validatePaymentTotals(total, amounts);
        return new CheckoutTotals(total, lineDiscountTotal, orderDiscount, orderDiscountPercent, discountTotal, amounts);
    }

    private Map<UUID, Product> loadProducts(Integer companyId, List<SaleItemRequest> items) {
        Set<UUID> ids = new HashSet<>();
        for (SaleItemRequest item : items) {
            ids.add(item.productId());
        }
        Map<UUID, Product> result = new HashMap<>();
        for (Product product : productRepository.findAllById(ids)) {
            if (!companyId.equals(product.getCompanyId())) {
                throw PharmacyErrors.of(PharmacyCatalogErrors.PHARM_PRODUCT_WRONG_COMPANY);
            }
            result.put(product.getId(), product);
        }
        if (result.size() != ids.size()) {
            throw PharmacyErrors.of(PharmacyCatalogErrors.PHARM_PRODUCTS_NOT_FOUND);
        }
        return result;
    }

    private static Integer requireCompanyId() {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_COMPANY_REQUIRED);
        }
        return companyId;
    }

    private static Integer requireStoreId(CreateSaleRequest req) {
        if (req.storeId() == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_STORE_REQUIRED);
        }
        return req.storeId();
    }

    private static SaleEnums.ReceiptType requireSaleReceipt(String raw) {
        SaleEnums.ReceiptType receiptType = SaleEnumParser.receiptType(raw);
        if (receiptType != SaleEnums.ReceiptType.SALE) {
            throw PharmacyErrors.of(PharmacySaleErrors.PHARM_SALE_TYPE_UNSUPPORTED);
        }
        return receiptType;
    }

    private static SaleEnums.CardType resolveCardType(
        SaleEnums.PaymentMethod paymentMethod,
        SaleEnums.CardType cardType,
        SalePaymentResolver.PaymentAmounts amounts
    ) {
        if (paymentMethod == SaleEnums.PaymentMethod.CASHLESS) {
            return null;
        }
        if (paymentMethod == SaleEnums.PaymentMethod.CARD && cardType == null) {
            return SaleEnums.CardType.HUMO;
        }
        if (amounts.card().signum() > 0 && cardType == null) {
            return SaleEnums.CardType.HUMO;
        }
        return cardType;
    }

    private record CheckoutTotals(
        BigDecimal total,
        BigDecimal lineDiscountTotal,
        BigDecimal orderDiscount,
        BigDecimal orderDiscountPercent,
        BigDecimal discountTotal,
        SalePaymentResolver.PaymentAmounts amounts
    ) {}
}
