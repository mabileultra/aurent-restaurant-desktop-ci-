package com.pos.platform.dto.company;

public record CompanyStatsResponse(
    long total,
    long active,
    long inactive
) {}
