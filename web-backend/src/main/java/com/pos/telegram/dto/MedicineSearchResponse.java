package com.pos.telegram.dto;

import java.util.List;

public record MedicineSearchResponse(
    String query,
    int totalItems,
    List<MedicineSearchItemDto> items
) {}
