package com.pos.reporting.dto;

import com.pos.shared.event.StockReceivedEvent;

import java.util.List;

public record StockFactsPageResponse(
    List<StockReceivedEvent> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {}
