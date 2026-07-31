package com.pos.ai.dto.report;

import java.math.BigDecimal;

public record DailyPoint(
    String date,
    BigDecimal revenue
) {}
