package com.pos.pharmacy.shift.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record OpenPharmacyShiftRequest(
    @Size(max = 200) String storeName,
    @Size(max = 200) String cashierName,
    @DecimalMin("0") BigDecimal openingCash,
    @Size(max = 1000) String comment
) {
}
