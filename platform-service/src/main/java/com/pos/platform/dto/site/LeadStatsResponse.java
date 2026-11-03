package com.pos.platform.dto.site;

public record LeadStatsResponse(
    long total,
    long newCount,
    long inProgressCount,
    long doneCount,
    long rejectedCount,
    long unansweredCount
) {}
