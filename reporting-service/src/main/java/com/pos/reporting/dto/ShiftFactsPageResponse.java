package com.pos.reporting.dto;

import com.pos.shared.event.ShiftClosedEvent;

import java.util.List;

public record ShiftFactsPageResponse(
    List<ShiftClosedEvent> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {}
