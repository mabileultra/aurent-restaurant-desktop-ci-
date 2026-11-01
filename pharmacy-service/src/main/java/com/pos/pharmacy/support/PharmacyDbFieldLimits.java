package com.pos.pharmacy.support;

import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Жёсткие лимиты колонок PostgreSQL: режем/клампим до INSERT,
 * чтобы один длинный код/серия/наценка не валил весь чанк импорта.
 */
public final class PharmacyDbFieldLimits {

    public static final int SKU = 100;
    public static final int BARCODE = 100;
    public static final int IKPU = 32;
    public static final int IKPU_STATUS = 30;
    public static final int PACKAGE_CODE = 20;
    public static final int BATCH_NUMBER = 80;
    public static final int INVOICE_NUMBER = 80;
    public static final int UZ_INVOICE_DOCUMENT_ID = 64;

    /** stock_receipt_lines.markup_percent NUMERIC(8,2). */
    public static final BigDecimal MARKUP_ABS_MAX = new BigDecimal("999999.99");

    /** stock_receipt_lines.vat_percent / products.tax_rate NUMERIC(5,2). */
    public static final BigDecimal VAT_ABS_MAX = new BigDecimal("999.99");

    private PharmacyDbFieldLimits() {}

    public static String truncate(String value, int maxLen) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLen) {
            return trimmed;
        }
        return trimmed.substring(0, maxLen);
    }

    public static String sku(String value) {
        return truncate(value, SKU);
    }

    public static String barcode(String value) {
        return truncate(value, BARCODE);
    }

    public static String ikpu(String value) {
        return truncate(value, IKPU);
    }

    public static String ikpuStatus(String value) {
        return truncate(value, IKPU_STATUS);
    }

    public static String packageCode(String value) {
        return truncate(value, PACKAGE_CODE);
    }

    public static String batchNumber(String value) {
        return truncate(value, BATCH_NUMBER);
    }

    public static String invoiceNumber(String value) {
        return truncate(value, INVOICE_NUMBER);
    }

    public static String uzInvoiceDocumentId(String value) {
        return truncate(value, UZ_INVOICE_DOCUMENT_ID);
    }

    public static BigDecimal markupPercent(BigDecimal value) {
        return clampAbs(value, MARKUP_ABS_MAX);
    }

    public static BigDecimal vatPercent(BigDecimal value) {
        return clampAbs(value, VAT_ABS_MAX);
    }

    private static BigDecimal clampAbs(BigDecimal value, BigDecimal absMax) {
        if (value == null) {
            return null;
        }
        BigDecimal scaled = value.setScale(2, RoundingMode.HALF_UP);
        if (scaled.abs().compareTo(absMax) <= 0) {
            return scaled;
        }
        return scaled.signum() < 0 ? absMax.negate() : absMax;
    }
}
