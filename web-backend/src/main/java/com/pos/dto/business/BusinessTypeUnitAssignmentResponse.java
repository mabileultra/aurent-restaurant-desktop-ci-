package com.pos.dto.business;

public record BusinessTypeUnitAssignmentResponse(
    String unitCode,
    String labelRu,
    String labelShortRu,
    String category,
    boolean defaultUnit,
    int sortOrder
) {}
