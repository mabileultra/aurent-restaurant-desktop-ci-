package com.pos.catalog.dto.unit;

import java.math.BigDecimal;

public record UnitConversionResponse(
    String fromCode,
    String toCode,
    BigDecimal factor
) {}
