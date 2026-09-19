package com.pos.pharmacy.exception.errorcode;

import com.pos.pharmacy.exception.PharmacyErrorCode;

/** SQL-ограничения → стабильный код, без сырого текста PostgreSQL. */
public final class PharmacySqlConstraintError {

    private PharmacySqlConstraintError() {}

    public static PharmacyErrorCode of(Throwable error) {
        String text = fold(error);
        if (text.contains("fk_stock_lots_receipt_line")) {
            return PharmacyReceiptErrors.PHARM_RECEIPT_LINE_HAS_LOT;
        }
        if (text.contains("varying(190)") || text.contains("character varying(190)")) {
            return PharmacyMarkErrors.PHARM_MARK_TOO_LONG;
        }
        if (text.contains("uk_pharm_stock_marks_company_key")) {
            return PharmacyMarkErrors.PHARM_MARK_ALREADY_ON_STOCK;
        }
        if (text.contains("stock_receipts_receipt_number_key")) {
            return PharmacyReceiptErrors.PHARM_RECEIPT_NUMBER_TAKEN;
        }
        return PharmacyReceiptErrors.PHARM_RECEIPT_SAVE_FAILED;
    }

    private static String fold(Throwable error) {
        StringBuilder sb = new StringBuilder();
        Throwable current = error;
        int depth = 0;
        while (current != null && depth < 12) {
            if (current.getMessage() != null) {
                sb.append(current.getMessage().toLowerCase()).append(' ');
            }
            current = current.getCause();
            depth++;
        }
        return sb.toString();
    }
}
