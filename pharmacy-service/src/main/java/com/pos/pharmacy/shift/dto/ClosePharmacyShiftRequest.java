package com.pos.pharmacy.shift.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ClosePharmacyShiftRequest(
    @DecimalMin("0") BigDecimal closingCash,
    @Size(max = 1000) String comment
) {
}
