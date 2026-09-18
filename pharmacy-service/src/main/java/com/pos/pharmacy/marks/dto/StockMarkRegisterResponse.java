package com.pos.pharmacy.marks.dto;

import java.util.List;
import java.util.UUID;

public record StockMarkRegisterResponse(
    int registered,
    List<UUID> markIds
) {
}
