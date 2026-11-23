package com.pos.catalog.dto.product;

import java.util.List;

/**
 * @param linked существующие карточки, привязанные к филиалу/кассе (не создавались заново)
 */
public record ProductImportResponse(
    int created,
    int skipped,
    List<String> errors,
    String receiptNumber,
    int linked
) {

    public ProductImportResponse(int created, int skipped, List<String> errors) {
        this(created, skipped, errors, null, 0);
    }

    public ProductImportResponse(int created, int skipped, List<String> errors, String receiptNumber) {
        this(created, skipped, errors, receiptNumber, 0);
    }
}
