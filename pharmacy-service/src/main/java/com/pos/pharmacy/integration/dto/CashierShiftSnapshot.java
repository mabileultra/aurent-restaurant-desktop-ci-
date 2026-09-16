package com.pos.pharmacy.integration.dto;

import java.util.UUID;

public record CashierShiftSnapshot(
    UUID id,
    Integer storeId,
    String storeName,
    String cashierName,
    String status
) {}
