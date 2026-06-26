package com.pos.reporting.dto;

import java.math.BigDecimal;

public record DailyPoint(
    String date,
    BigDecimal revenue
) {}
