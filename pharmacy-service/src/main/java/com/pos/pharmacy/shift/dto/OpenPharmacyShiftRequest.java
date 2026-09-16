package com.pos.pharmacy.shift.dto;

import java.math.BigDecimal;

public record OpenPharmacyShiftRequest(
    String storeName,
    String cashierName,
    BigDecimal openingCash,
    String comment
) {
}
