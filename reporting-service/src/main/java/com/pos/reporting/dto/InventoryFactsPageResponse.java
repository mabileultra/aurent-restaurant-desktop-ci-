package com.pos.reporting.dto;

import com.pos.shared.event.StockInventoryRecordedEvent;

import java.util.List;

public record InventoryFactsPageResponse(
    List<StockInventoryRecordedEvent> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {}
