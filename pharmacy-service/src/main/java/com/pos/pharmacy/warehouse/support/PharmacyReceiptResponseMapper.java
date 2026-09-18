package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptLineResponse;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptResponse;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.entity.Supplier;
import com.pos.pharmacy.warehouse.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PharmacyReceiptResponseMapper {

    private final ProductAttributeService productAttributeService;
    private final SupplierRepository supplierRepository;

    public PharmacyStockReceiptResponse toResponse(StockReceipt receipt) {
        Supplier supplier = resolveSupplier(receipt.getSupplierId());
        Set<UUID> productIds = new HashSet<>();
        for (StockReceiptLine line : receipt.getLines()) {
            if (line.getProduct() != null) {
                productIds.add(line.getProduct().getId());
            }
        }
        Map<UUID, Map<String, String>> attributes = productAttributeService.getAttributesByProductIds(productIds);
        List<PharmacyStockReceiptLineResponse> lines = receipt.getLines().stream()
            .map(line -> toLineResponse(line, attributes.getOrDefault(
                line.getProduct().getId(), Map.of()
            )))
            .toList();
        return baseResponse(receipt, supplier, lines.size(), lines);
    }

    public PharmacyStockReceiptResponse toSummary(StockReceipt receipt) {
        Supplier supplier = resolveSupplier(receipt.getSupplierId());
        return baseResponse(receipt, supplier, 0, List.of());
    }

    private PharmacyStockReceiptResponse baseResponse(
        StockReceipt receipt,
        Supplier supplier,
        int lineCount,
        List<PharmacyStockReceiptLineResponse> lines
    ) {
        return new PharmacyStockReceiptResponse(
            receipt.getId(),
            receipt.getReceiptNumber(),
            receipt.getStatus(),
            receipt.getDocumentDate(),
            receipt.getReceiptType(),
            receipt.getDefaultMarkupPercent(),
            receipt.getInvoiceNumber(),
            receipt.getInvoiceDate(),
            receipt.getContractNumber(),
            receipt.getFinancialDiscount(),
            receipt.getPaymentType(),
            receipt.getSupplierId(),
            supplier != null ? supplier.getName() : null,
            receipt.getStoreId(),
            null,
            receipt.getNotes(),
            receipt.getTotalQuantity(),
            receipt.getTotalCost(),
            receipt.getTotalRetail() != null ? receipt.getTotalRetail() : BigDecimal.ZERO,
            lineCount,
            null,
            receipt.getCreatedAt(),
            receipt.getActivatedAt(),
            null,
            lines
        );
    }

    private Supplier resolveSupplier(UUID supplierId) {
        if (supplierId == null) {
            return null;
        }
        return supplierRepository.findById(supplierId).orElse(null);
    }

    private PharmacyStockReceiptLineResponse toLineResponse(StockReceiptLine line, Map<String, String> attrs) {
        return new PharmacyStockReceiptLineResponse(
            line.getId(),
            line.getProduct().getId(),
            line.getProduct().getName(),
            line.getProduct().getSku(),
            attrs.get(PharmacyReceiptSupport.ATTR_MANUFACTURER),
            attrs.get(PharmacyReceiptSupport.ATTR_COUNTRY),
            attrs.get(PharmacyReceiptSupport.ATTR_DOSAGE_FORM),
            line.getQuantity(),
            line.getPurchasePrice(),
            line.getUnitSellingPrice(),
            line.getLineCost(),
            line.getVatPercent(),
            line.getMarkupPercent(),
            line.getUnitsInPack(),
            line.getPurchasePriceWithVat(),
            line.getRetailPrice(),
            line.getUnitRetailPrice(),
            line.getLineRetail(),
            line.getBatchNumber(),
            line.getExpiryDate(),
            line.getProduct().isMarkedProduct()
        );
    }
}
