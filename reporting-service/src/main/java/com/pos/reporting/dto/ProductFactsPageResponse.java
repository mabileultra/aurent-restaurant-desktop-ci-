package com.pos.reporting.dto;

import com.pos.shared.event.ProductSnapshotEvent;

import java.util.List;

public record ProductFactsPageResponse(
    List<ProductSnapshotEvent> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {}
