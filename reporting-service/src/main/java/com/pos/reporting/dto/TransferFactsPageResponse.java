package com.pos.reporting.dto;

import com.pos.shared.event.StockTransferRecordedEvent;

import java.util.List;

public record TransferFactsPageResponse(
    List<StockTransferRecordedEvent> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {}
