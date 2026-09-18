package com.pos.pharmacy.marks.dto;

import com.pos.pharmacy.marks.entity.StockMarkStatus;

import java.util.UUID;

public record StockMarkCheckResponse(
    boolean found,
    boolean alreadySold,
    StockMarkStatus status,
    UUID productId,
    UUID markId,
    Integer storeId
) {
    public static StockMarkCheckResponse missing() {
        return new StockMarkCheckResponse(false, false, null, null, null, null);
    }
}
