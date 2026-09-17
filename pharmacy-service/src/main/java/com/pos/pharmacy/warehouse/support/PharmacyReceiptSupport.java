package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptLineRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptLineResponse;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptResponse;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.entity.Supplier;
import com.pos.pharmacy.warehouse.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PharmacyReceiptSupport {

    public static final String ATTR_UNITS_IN_PACK = "units_in_pack";
    public static final String ATTR_MANUFACTURER = "manufacturer";
    public static final String ATTR_COUNTRY = "country";
    public static final String ATTR_DOSAGE_FORM = "dosage_form";
    public static final String DEFAULT_RECEIPT_TYPE = "RECEIPT";

    private final ProductAttributeService productAttributeService;
    private final SupplierRepository supplierRepository;

    public void requireDraft(StockReceipt receipt) {
        if (!StockReceiptStatus.DRAFT.equals(receipt.getStatus())) {
            throw PharmacyErrors.badRequest("Only draft pharmacy receipts can be edited");
        }
    }

    public void requireLineLotFields(StockReceiptLine line) {
        if (!StringUtils.hasText(line.getBatchNumber())) {
            throw PharmacyErrors.badRequest(
                "Batch number is required for all lines before activation",
                "batchNumber",
                line.getProduct() != null ? line.getProduct().getName() : null
            );
        }
        if (line.getExpiryDate() == null) {
            throw PharmacyErrors.badRequest(
                "Expiry date is required for all lines before activation",
                "expiryDate",
                line.getProduct() != null ? line.getProduct().getName() : null
            );
        }
    }

    public void requireAllLinesHaveLots(StockReceipt receipt) {
        for (StockReceiptLine line : receipt.getLines()) {
            requireLineLotFields(line);
        }
    }

    public void applyLine(StockReceiptLine target, Product product, PharmacyStockReceiptLineRequest req) {
        StockReceiptLine built = buildLine(target.getReceipt(), product, req);
        target.setProduct(built.getProduct());
        target.setQuantity(built.getQuantity());
        target.setPurchasePrice(built.getPurchasePrice());
        target.setUnitSellingPrice(built.getUnitSellingPrice());
        target.setLineCost(built.getLineCost());
        target.setBatchNumber(built.getBatchNumber());
        target.setExpiryDate(built.getExpiryDate());
        target.setVatPercent(built.getVatPercent());
        target.setMarkupPercent(built.getMarkupPercent());
        target.setUnitsInPack(built.getUnitsInPack());
        target.setPurchasePriceWithVat(built.getPurchasePriceWithVat());
        target.setRetailPrice(built.getRetailPrice());
        target.setUnitRetailPrice(built.getUnitRetailPrice());
        target.setLineRetail(built.getLineRetail());
    }

    public void revalueLine(StockReceiptLine line, BigDecimal vatPercent, BigDecimal markupPercent) {
        BigDecimal purchase = scaleMoney(line.getPurchasePrice());
        BigDecimal vat = vatPercent != null ? vatPercent : nullToZero(line.getVatPercent());
        BigDecimal purchaseWithVat = withVat(purchase, vat);
        BigDecimal markup = markupPercent != null ? markupPercent : nullToZero(line.getMarkupPercent());
        BigDecimal retail = retailFromMarkup(purchaseWithVat, markup);
        BigDecimal unitsInPack = line.getUnitsInPack() != null && line.getUnitsInPack().compareTo(BigDecimal.ZERO) > 0
            ? line.getUnitsInPack()
            : BigDecimal.ONE;
        BigDecimal quantity = line.getQuantity() != null ? line.getQuantity() : BigDecimal.ZERO;
        line.setVatPercent(vat);
        line.setPurchasePriceWithVat(purchaseWithVat);
        line.setMarkupPercent(markup);
        line.setRetailPrice(retail);
        line.setUnitRetailPrice(unitPrice(retail, unitsInPack));
        line.setUnitSellingPrice(retail);
        line.setLineRetail(retail.multiply(quantity).setScale(2, RoundingMode.HALF_UP));
    }

    public BigDecimal resolveUnitsInPack(Product product, BigDecimal requested) {
        if (requested != null && requested.compareTo(BigDecimal.ZERO) > 0) {
            return requested;
        }
        Map<String, String> attrs = productAttributeService.getAttributes(product.getId());
        String raw = attrs.get(ATTR_UNITS_IN_PACK);
        if (!StringUtils.hasText(raw)) {
            return BigDecimal.ONE;
        }
        try {
            BigDecimal value = new BigDecimal(raw.trim().replace(',', '.'));
            return value.compareTo(BigDecimal.ZERO) > 0 ? value : BigDecimal.ONE;
        } catch (NumberFormatException ex) {
            return BigDecimal.ONE;
        }
    }

    public StockReceiptLine buildLine(StockReceipt receipt, Product product, PharmacyStockReceiptLineRequest req) {
        BigDecimal quantity = QuantityUtil.normalize(req.quantity());
        requirePositive(quantity);
        BigDecimal unitsInPack = resolveUnitsInPack(product, req.unitsInPack());
        BigDecimal purchase = scaleMoney(req.purchasePrice());
        BigDecimal vat = req.vatPercent() != null ? req.vatPercent() : BigDecimal.ZERO;
        BigDecimal purchaseWithVat = req.purchasePriceWithVat() != null
            ? scaleMoney(req.purchasePriceWithVat())
            : withVat(purchase, vat);
        BigDecimal retail = req.retailPrice() != null
            ? scaleMoney(req.retailPrice())
            : scaleMoney(req.unitSellingPrice());
        BigDecimal markup = req.markupPercent() != null
            ? req.markupPercent()
            : markupFrom(purchaseWithVat, retail);
        BigDecimal unitRetail = req.unitRetailPrice() != null
            ? scaleMoney(req.unitRetailPrice())
            : unitPrice(retail, unitsInPack);
        BigDecimal unitSelling = scaleMoney(req.unitSellingPrice() != null ? req.unitSellingPrice() : retail);
        BigDecimal lineCost = purchase.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        BigDecimal lineRetail = retail.multiply(quantity).setScale(2, RoundingMode.HALF_UP);

        return StockReceiptLine.builder()
            .receipt(receipt)
            .product(product)
            .quantity(quantity)
            .purchasePrice(purchase)
            .unitSellingPrice(unitSelling)
            .lineCost(lineCost)
            .batchNumber(trimToNull(req.batchNumber()))
            .expiryDate(req.expiryDate())
            .vatPercent(vat)
            .markupPercent(markup)
            .unitsInPack(unitsInPack)
            .purchasePriceWithVat(purchaseWithVat)
            .retailPrice(retail)
            .unitRetailPrice(unitRetail)
            .lineRetail(lineRetail)
            .build();
    }

    public void recalculateTotals(StockReceipt receipt) {
        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalRetail = BigDecimal.ZERO;
        for (StockReceiptLine line : receipt.getLines()) {
            totalQty = QuantityUtil.add(totalQty, line.getQuantity());
            totalCost = totalCost.add(nullToZero(line.getLineCost()));
            totalRetail = totalRetail.add(nullToZero(line.getLineRetail()));
        }
        receipt.setTotalQuantity(totalQty);
        receipt.setTotalCost(totalCost);
        receipt.setTotalRetail(totalRetail);
    }

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
            lines.size(),
            null,
            receipt.getCreatedAt(),
            receipt.getActivatedAt(),
            null,
            lines
        );
    }

    public PharmacyStockReceiptResponse toSummary(StockReceipt receipt) {
        Supplier supplier = resolveSupplier(receipt.getSupplierId());
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
            0,
            null,
            receipt.getCreatedAt(),
            receipt.getActivatedAt(),
            null,
            List.of()
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
            attrs.get(ATTR_MANUFACTURER),
            attrs.get(ATTR_COUNTRY),
            attrs.get(ATTR_DOSAGE_FORM),
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
            line.getExpiryDate()
        );
    }

    private static void requirePositive(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw PharmacyErrors.badRequest("Quantity must be positive");
        }
    }

    private static BigDecimal withVat(BigDecimal purchase, BigDecimal vatPercent) {
        if (vatPercent == null || vatPercent.compareTo(BigDecimal.ZERO) == 0) {
            return purchase;
        }
        BigDecimal factor = BigDecimal.ONE.add(vatPercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        return purchase.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal retailFromMarkup(BigDecimal purchaseWithVat, BigDecimal markupPercent) {
        if (purchaseWithVat == null) {
            return BigDecimal.ZERO;
        }
        if (markupPercent == null || markupPercent.compareTo(BigDecimal.ZERO) == 0) {
            return purchaseWithVat;
        }
        BigDecimal factor = BigDecimal.ONE.add(markupPercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        return purchaseWithVat.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal markupFrom(BigDecimal purchaseWithVat, BigDecimal retail) {
        if (purchaseWithVat == null || purchaseWithVat.compareTo(BigDecimal.ZERO) <= 0 || retail == null) {
            return BigDecimal.ZERO;
        }
        return retail.subtract(purchaseWithVat)
            .multiply(BigDecimal.valueOf(100))
            .divide(purchaseWithVat, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal unitPrice(BigDecimal retail, BigDecimal unitsInPack) {
        if (retail == null || unitsInPack == null || unitsInPack.compareTo(BigDecimal.ZERO) <= 0) {
            return retail;
        }
        return retail.divide(unitsInPack, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal scaleMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    public static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
