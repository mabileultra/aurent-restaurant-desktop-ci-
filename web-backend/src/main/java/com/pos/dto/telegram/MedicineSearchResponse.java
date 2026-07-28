package com.pos.dto.telegram;

import java.util.List;

public record MedicineSearchResponse(
    String query,
    int totalItems,
    List<MedicineSearchItemDto> items
) {}
