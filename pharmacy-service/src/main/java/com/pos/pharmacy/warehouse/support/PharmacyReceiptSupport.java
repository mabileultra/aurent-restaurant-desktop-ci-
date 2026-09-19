package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptLineRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyStockReceiptResponse;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PharmacyReceiptSupport {

    public static final String ATTR_UNITS_IN_PACK = "units_in_pack";
    public static final String ATTR_MANUFACTURER = "manufacturer";
    public static final String ATTR_COUNTRY = "country";
    public static final String ATTR_DOSAGE_FORM = "dosage_form";
    public static final String ATTR_PRESCRIPTION_REQUIRED = "prescription_required";
    public static final String DEFAULT_RECEIPT_TYPE = "RECEIPT";

    private final ProductAttributeService productAttributeService;
    private final PharmacyReceiptResponseMapper responseMapper;

    public void requireDraft(StockReceipt receipt) {
        if (!StockReceiptStatus.DRAFT.equals(receipt.getStatus())) {
            throw PharmacyErrors.badRequest("Only draft pharmacy receipts can be edited");
        }
    }

    public void applyPrices(StockReceiptLine target, Product product, PharmacyStockReceiptLineRequest req) {
        Product current = target.getProduct() != null ? target.getProduct() : product;
        PharmacyStockReceiptLineRequest locked = new PharmacyStockReceiptLineRequest(
            current.getId(),
            target.getQuantity(),
            req.purchasePrice(),
            req.unitSellingPrice(),
            req.vatPercent(),
            req.markupPercent(),
            target.getUnitsInPack(),
            req.purchasePriceWithVat(),
            req.retailPrice(),
            req.unitRetailPrice(),
            target.getBatchNumber(),
            target.getExpiryDate()
        );
        applyLine(target, current, locked);
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
        BigDecimal purchase = PharmacyReceiptPricing.scaleMoney(line.getPurchasePrice());
        BigDecimal vat = vatPercent != null ? vatPercent : PharmacyReceiptPricing.nullToZero(line.getVatPercent());
        BigDecimal purchaseWithVat = PharmacyReceiptPricing.withVat(purchase, vat);
        line.setVatPercent(vat);
        line.setPurchasePriceWithVat(purchaseWithVat);
        if (markupPercent == null) {
            BigDecimal retail = line.getRetailPrice() != null
                ? PharmacyReceiptPricing.scaleMoney(line.getRetailPrice())
                : PharmacyReceiptPricing.scaleMoney(line.getUnitSellingPrice());
            line.setMarkupPercent(PharmacyReceiptPricing.markupFrom(purchaseWithVat, retail));
            return;
        }
        BigDecimal retail = PharmacyReceiptPricing.retailFromMarkup(purchaseWithVat, markupPercent);
        BigDecimal unitsInPack = line.getUnitsInPack() != null && line.getUnitsInPack().compareTo(BigDecimal.ZERO) > 0
            ? line.getUnitsInPack()
            : BigDecimal.ONE;
        BigDecimal quantity = line.getQuantity() != null ? line.getQuantity() : BigDecimal.ZERO;
        line.setMarkupPercent(markupPercent);
        line.setRetailPrice(retail);
        line.setUnitRetailPrice(PharmacyReceiptPricing.unitPrice(retail, unitsInPack));
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
        BigDecimal purchase = PharmacyReceiptPricing.scaleMoney(req.purchasePrice());
        BigDecimal vat = req.vatPercent() != null ? req.vatPercent() : BigDecimal.ZERO;
        BigDecimal purchaseWithVat = req.purchasePriceWithVat() != null
            ? PharmacyReceiptPricing.scaleMoney(req.purchasePriceWithVat())
            : PharmacyReceiptPricing.withVat(purchase, vat);
        BigDecimal retail = req.retailPrice() != null
            ? PharmacyReceiptPricing.scaleMoney(req.retailPrice())
            : PharmacyReceiptPricing.scaleMoney(req.unitSellingPrice());
        BigDecimal markup = req.markupPercent() != null
            ? req.markupPercent()
            : PharmacyReceiptPricing.markupFrom(purchaseWithVat, retail);
        BigDecimal unitRetail = req.unitRetailPrice() != null
            ? PharmacyReceiptPricing.scaleMoney(req.unitRetailPrice())
            : PharmacyReceiptPricing.unitPrice(retail, unitsInPack);
        BigDecimal unitSelling = PharmacyReceiptPricing.scaleMoney(
            req.unitSellingPrice() != null ? req.unitSellingPrice() : retail
        );
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
            totalCost = totalCost.add(PharmacyReceiptPricing.nullToZero(line.getLineCost()));
            totalRetail = totalRetail.add(PharmacyReceiptPricing.nullToZero(line.getLineRetail()));
        }
        receipt.setTotalQuantity(totalQty);
        receipt.setTotalCost(totalCost);
        receipt.setTotalRetail(totalRetail);
    }

    public PharmacyStockReceiptResponse toResponse(StockReceipt receipt) {
        return responseMapper.toResponse(receipt);
    }

    public PharmacyStockReceiptResponse toSummary(StockReceipt receipt) {
        return responseMapper.toSummary(receipt);
    }

    private static void requirePositive(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw PharmacyErrors.badRequest("Quantity must be positive");
        }
    }

    public static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
