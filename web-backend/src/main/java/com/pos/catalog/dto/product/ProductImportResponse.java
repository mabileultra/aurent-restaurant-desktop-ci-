package com.pos.catalog.dto.product;

import java.util.List;

public record ProductImportResponse(int created, int skipped, List<String> errors, String receiptNumber) {

    public ProductImportResponse(int created, int skipped, List<String> errors) {
        this(created, skipped, errors, null);
    }
}
