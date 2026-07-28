package com.pos.dto.telegram;

import java.util.List;
import java.util.UUID;

public record MedicineSearchItemDto(
    UUID productId,
    String productName,
    String barcode,
    String ikpu,
    List<MedicineStoreMatchDto> matches
) {}
