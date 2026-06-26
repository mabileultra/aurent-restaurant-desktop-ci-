package com.pos.reporting.dto;

import com.pos.shared.event.StockMovementRecordedEvent;

import java.util.List;

public record MovementFactsPageResponse(
    List<StockMovementRecordedEvent> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {}
