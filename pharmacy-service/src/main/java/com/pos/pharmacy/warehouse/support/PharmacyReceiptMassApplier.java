package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyReceiptErrors;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.domain.PharmacyReceiptMassField;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

/** Одно значение на выбранные строки фактуры. Серия и срок могут быть пустыми. */
@Component
public class PharmacyReceiptMassApplier {

    private final PharmacyReceiptSupport pharmacyReceipt;

    public PharmacyReceiptMassApplier(PharmacyReceiptSupport pharmacyReceipt) {
        this.pharmacyReceipt = pharmacyReceipt;
    }

    public void apply(StockReceiptLine line, PharmacyReceiptMassField field, String raw) {
        String value = raw == null ? "" : raw.trim();
        switch (field) {
            case QUANTITY -> applyQuantity(line, money(value, "quantity"));
            case UNITS_IN_PACK -> applyUnitsInPack(line, money(value, "unitsInPack"));
            case PURCHASE -> {
                line.setPurchasePrice(money(value, "purchasePrice"));
                pharmacyReceipt.revalueLine(line, line.getVatPercent(), line.getMarkupPercent());
            }
            case VAT -> pharmacyReceipt.revalueLine(line, percent(value, 100), null);
            case MARKUP -> pharmacyReceipt.revalueLine(line, null, percent(value, 1000));
            case RETAIL -> applyRetail(line, money(value, "retailPrice"));
            case BATCH -> line.setBatchNumber(StringUtils.hasText(value) ? value : null);
            case EXPIRY -> line.setExpiryDate(parseExpiry(value));
            default -> throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_MASS_FIELD_UNKNOWN);
        }
    }

    private void applyQuantity(StockReceiptLine line, BigDecimal quantity) {
        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_QTY_POSITIVE);
        }
        BigDecimal qty = QuantityUtil.normalize(quantity);
        BigDecimal purchase = nullToZero(line.getPurchasePrice());
        BigDecimal retail = line.getRetailPrice() != null ? line.getRetailPrice() : nullToZero(line.getUnitSellingPrice());
        line.setQuantity(qty);
        line.setLineCost(purchase.multiply(qty).setScale(2, RoundingMode.HALF_UP));
        line.setLineRetail(retail.multiply(qty).setScale(2, RoundingMode.HALF_UP));
    }

    private void applyUnitsInPack(StockReceiptLine line, BigDecimal unitsInPack) {
        if (unitsInPack.compareTo(BigDecimal.ZERO) <= 0) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_QTY_POSITIVE);
        }
        BigDecimal units = QuantityUtil.normalize(unitsInPack);
        BigDecimal retail = line.getRetailPrice() != null
            ? line.getRetailPrice()
            : nullToZero(line.getUnitSellingPrice());
        line.setUnitsInPack(units);
        line.setUnitRetailPrice(PharmacyReceiptPricing.unitPrice(retail, units));
    }

    private void applyRetail(StockReceiptLine line, BigDecimal retail) {
        BigDecimal purchaseWithVat = line.getPurchasePriceWithVat() != null
            ? line.getPurchasePriceWithVat()
            : nullToZero(line.getPurchasePrice());
        BigDecimal units = line.getUnitsInPack() != null && line.getUnitsInPack().compareTo(BigDecimal.ZERO) > 0
            ? line.getUnitsInPack()
            : BigDecimal.ONE;
        BigDecimal qty = line.getQuantity() != null ? line.getQuantity() : BigDecimal.ZERO;
        line.setRetailPrice(retail);
        line.setUnitSellingPrice(retail);
        line.setUnitRetailPrice(retail.divide(units, 2, RoundingMode.HALF_UP));
        line.setLineRetail(retail.multiply(qty).setScale(2, RoundingMode.HALF_UP));
        if (purchaseWithVat.compareTo(BigDecimal.ZERO) > 0) {
            line.setMarkupPercent(
                retail.subtract(purchaseWithVat)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(purchaseWithVat, 2, RoundingMode.HALF_UP)
            );
        }
    }

    private static LocalDate parseExpiry(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_EXPIRY_FORMAT);
        }
    }

    private static BigDecimal money(String value, String field) {
        BigDecimal number = decimal(value, field);
        if (number.compareTo(BigDecimal.ZERO) < 0) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_AMOUNT_NEGATIVE, field, field);
        }
        return number.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal percent(String value, int max) {
        BigDecimal number = decimal(value, "percent");
        if (number.compareTo(BigDecimal.ZERO) < 0 || number.compareTo(BigDecimal.valueOf(max)) > 0) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_PERCENT_RANGE);
        }
        return number;
    }

    private static BigDecimal decimal(String value, String field) {
        if (!StringUtils.hasText(value)) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_FIELD_REQUIRED, "field", field);
        }
        try {
            return new BigDecimal(value.replace(',', '.').replace(" ", ""));
        } catch (NumberFormatException ex) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_FIELD_NOT_NUMBER, "field", field);
        }
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
