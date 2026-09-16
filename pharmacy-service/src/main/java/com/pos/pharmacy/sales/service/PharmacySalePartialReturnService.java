package com.pos.pharmacy.sales.service;

import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.revenue.service.PharmacyRefundPublicationService;
import com.pos.pharmacy.revenue.service.PharmacyRevenuePublicationService;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.PartialReturnLineRequest;
import com.pos.pharmacy.sales.dto.PartialReturnRequest;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.entity.SaleItem;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.support.SaleMapper;
import com.pos.pharmacy.shift.support.PharmacyShiftRefundApplier;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.util.QuantityValidator;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import com.pos.pharmacy.warehouse.support.PharmacyLotFefoSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.shared.money.TenderNet;
import com.pos.shared.money.TenderNetCalculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PharmacySalePartialReturnService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final StoreStockService storeStockService;
    private final PharmacyLotFefoSupport pharmacyLotFefoSupport;
    private final SaleMapper saleMapper;
    private final PharmacyRevenuePublicationService revenuePublicationService;
    private final PharmacyRefundPublicationService refundPublicationService;
    private final PharmacyShiftRefundApplier shiftRefundApplier;

    public SaleResponse returnItems(UUID saleId, PartialReturnRequest request) {
        Sale sale = requireSale(saleId);
        assertCanMutate(sale);

        Map<UUID, SaleItem> itemsById = new HashMap<>();
        sale.getItems().forEach(item -> itemsById.put(item.getId(), item));

        String reason = request.reason() != null ? request.reason().trim() : "";
        BigDecimal returnedBefore = shiftRefundApplier.returnedNow(sale);
        boolean anyReturned = false;

        for (PartialReturnLineRequest line : request.lines()) {
            SaleItem item = itemsById.get(line.saleItemId());
            if (item == null) {
                throw PharmacyErrors.badRequest("Позиция чека не найдена: " + line.saleItemId());
            }
            BigDecimal returnQty = item.getProduct() != null
                ? QuantityValidator.normalizeForProduct(item.getProduct(), line.quantity())
                : QuantityUtil.normalize(line.quantity());
            if (returnQty.signum() <= 0) {
                continue;
            }
            if (item.getProduct() != null) {
                QuantityValidator.validate(item.getProduct(), returnQty);
            }
            BigDecimal remaining = QuantityUtil.subtract(item.getQuantity(), item.getReturnedQuantity());
            if (returnQty.compareTo(remaining) > 0) {
                throw PharmacyErrors.badRequest(
                    "Нельзя вернуть больше, чем осталось по позиции: " + item.getProductName()
                );
            }

            item.setReturnedQuantity(QuantityUtil.add(item.getReturnedQuantity(), returnQty));
            restoreStock(sale, item, returnQty);
            anyReturned = true;
        }

        if (!anyReturned) {
            throw PharmacyErrors.badRequest("Укажите количество для возврата");
        }

        appendReturnNote(sale, reason, allItemsFullyReturned(sale));
        sale.setStatus(allItemsFullyReturned(sale) ? SaleEnums.SaleStatus.VOIDED : SaleEnums.SaleStatus.REFUNDED);

        Sale saved = saleRepository.save(sale);
        shiftRefundApplier.applySince(saved, returnedBefore);
        revenuePublicationService.onSaleCompleted(saved, Map.of(), null);
        publishRefund(saved, returnedBefore);
        return saleMapper.toResponse(saved);
    }

    private void publishRefund(Sale sale, BigDecimal returnedBefore) {
        TenderNet beforeNet = TenderNetCalculator.remaining(
            sale.getTotalAmount(), sale.getCashAmount(), sale.getCardAmount(), returnedBefore
        );
        TenderNet afterNet = TenderNetCalculator.remaining(
            sale.getTotalAmount(), sale.getCashAmount(), sale.getCardAmount(), shiftRefundApplier.returnedNow(sale)
        );
        refundPublicationService.onRefund(
            sale,
            UUID.randomUUID(),
            beforeNet.total().subtract(afterNet.total()),
            beforeNet.cash().subtract(afterNet.cash()),
            beforeNet.card().subtract(afterNet.card())
        );
    }

    public static boolean allItemsFullyReturned(Sale sale) {
        return sale.getItems().stream()
            .allMatch(item -> item.getReturnedQuantity().compareTo(item.getQuantity()) >= 0);
    }

    public static BigDecimal lineReturnAmount(SaleItem item, BigDecimal returnQty) {
        if (returnQty == null || returnQty.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal qty = QuantityUtil.normalize(item.getQuantity());
        BigDecimal ret = QuantityUtil.normalize(returnQty);
        if (ret.compareTo(qty) >= 0) {
            return item.getLineTotal() != null ? item.getLineTotal() : BigDecimal.ZERO;
        }
        BigDecimal lineTotal = item.getLineTotal() != null ? item.getLineTotal() : BigDecimal.ZERO;
        return lineTotal.multiply(ret).divide(qty, 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal totalReturnedAmount(Sale sale) {
        BigDecimal sum = BigDecimal.ZERO;
        for (SaleItem item : sale.getItems()) {
            sum = sum.add(lineReturnAmount(item, item.getReturnedQuantity()));
        }
        return sum;
    }

    private void restoreStock(Sale sale, SaleItem item, BigDecimal qty) {
        var product = item.getProduct();
        storeStockService.increase(product, sale.getStoreId(), qty);
        pharmacyLotFefoSupport.restorePartial(item, qty);
        productRepository.save(product);
    }

    private Sale requireSale(UUID saleId) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        return saleRepository.findByIdAndCompanyId(saleId, companyId)
            .orElseThrow(() -> PharmacyErrors.notFound("Sale", saleId));
    }

    private static void assertCanMutate(Sale sale) {
        if (sale.getStatus() == SaleEnums.SaleStatus.VOIDED) {
            throw PharmacyErrors.badRequest("Чек уже полностью возвращён");
        }
    }

    private static void appendReturnNote(Sale sale, String reason, boolean full) {
        String tag = full ? "VOID" : "PARTIAL_RETURN";
        String note = reason != null && !reason.isBlank() ? tag + ": " + reason : tag;
        String prev = sale.getNotes();
        sale.setNotes(prev != null && !prev.isBlank() ? prev + " | " + note : note);
    }
}
