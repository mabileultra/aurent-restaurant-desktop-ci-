package com.pos.pharmacy.shift.dto;

import java.math.BigDecimal;

public record ClosePharmacyShiftRequest(
    BigDecimal closingCash,
    String comment
) {
}
