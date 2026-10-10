package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsRegionCardResponse(
    String regionCode,
    String nameRu,
    String nameUz,
    long enterprises,
    BigDecimal turnoverDeltaPct
) {}
