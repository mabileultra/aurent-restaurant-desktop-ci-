package com.pos.reporting.dto;

import com.pos.shared.event.SaleCompletedEvent;

import java.util.List;

public record SaleFactsPageResponse(
    List<SaleCompletedEvent> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {}
