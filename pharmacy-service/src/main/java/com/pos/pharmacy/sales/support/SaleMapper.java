package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.domain.SaleType;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.entity.SaleItem;
import com.pos.pharmacy.sales.service.PharmacySalePartialReturnService;
import com.pos.pharmacy.util.QuantityUtil;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class SaleMapper {

    public SaleResponse toResponse(Sale sale) {
        return toResponse(sale, null, null, null, null, null);
    }

    public SaleResponse toResponse(Sale sale, String storeName, String shiftStatus) {
        return toResponse(sale, storeName, shiftStatus, null, null, null);
    }

    public SaleResponse toResponse(
        Sale sale,
        String storeName,
        String shiftStatus,
        Instant shiftOpenedAt,
        Instant shiftClosedAt,
        Long shiftZReportId
    ) {
        if (sale == null) {
            return null;
        }
        return new SaleResponse(
            sale.getId(),
            sale.getReceiptNumber(),
            sale.getCashierName(),
            sale.getStoreId(),
            storeName,
            null,
            sale.getCreatedAt(),
            mapLines(sale.getItems()),
            sale.getSubtotal(),
            sale.getTaxTotal(),
            sale.getDiscountTotal(),
            sale.getLineDiscountTotal(),
            sale.getOrderDiscountAmount(),
            sale.getOrderDiscountPercent(),
            sale.getTotalAmount(),
            returnAmount(sale),
            enumName(sale.getPaymentMethod()),
            enumName(sale.getCardType()),
            sale.getCashAmount(),
            sale.getCardAmount(),
            enumName(sale.getReceiptType()),
            sale.getAmountTendered(),
            sale.getChangeGiven(),
            enumName(sale.getStatus()),
            sale.getNotes(),
            sale.getPatientPinfl(),
            sale.getLoyaltyPhone(),
            sale.isPharmacyDmed(),
            sale.getCashierShiftId(),
            shiftOpenedAt,
            shiftClosedAt,
            shiftStatus,
            shiftZReportId,
            sale.getFiscalStatus(),
            sale.getFiscalSign(),
            sale.getFiscalReceiptSeq(),
            sale.getMultikassaSaleId(),
            sale.getFiscalQrUrl(),
            sale.getFiscalTerminalId(),
            sale.getFiscalizedAt(),
            sale.isPrintFiscalQr()
        );
    }

    private List<SaleResponse.SaleLineDto> mapLines(List<SaleItem> items) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        return items.stream().map(this::mapLine).toList();
    }

    private SaleResponse.SaleLineDto mapLine(SaleItem item) {
        BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
        BigDecimal returned = item.getReturnedQuantity() != null ? item.getReturnedQuantity() : BigDecimal.ZERO;
        BigDecimal returnable = QuantityUtil.subtract(qty, returned).max(BigDecimal.ZERO);
        var product = item.getProduct();
        return new SaleResponse.SaleLineDto(
            item.getId(),
            item.getProductName(),
            product != null && product.getSaleType() != null ? product.getSaleType().name() : SaleType.PIECE.name(),
            product != null && product.getUnitCode() != null ? product.getUnitCode().name() : null,
            qty,
            returned,
            returnable,
            item.getUnitPrice(),
            item.getLineTotal(),
            item.getTaxAmount(),
            item.getDiscount(),
            product != null ? product.getTaxRate() : null,
            product != null ? product.getIkpu() : null,
            product != null ? product.getSku() : null,
            item.getBatchNumber(),
            item.getExpiryDate()
        );
    }

    private BigDecimal returnAmount(Sale sale) {
        if (sale.getStatus() == null) {
            return BigDecimal.ZERO;
        }
        if (sale.getStatus() != SaleEnums.SaleStatus.VOIDED && sale.getStatus() != SaleEnums.SaleStatus.REFUNDED) {
            return BigDecimal.ZERO;
        }
        if (sale.getItems() == null || sale.getItems().isEmpty()) {
            return sale.getStatus() == SaleEnums.SaleStatus.VOIDED && sale.getTotalAmount() != null
                ? sale.getTotalAmount()
                : BigDecimal.ZERO;
        }
        return PharmacySalePartialReturnService.totalReturnedAmount(sale);
    }

    private static String enumName(Enum<?> value) {
        return value != null ? value.name() : null;
    }
}
