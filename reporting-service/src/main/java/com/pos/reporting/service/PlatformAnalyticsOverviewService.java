package com.pos.reporting.service;

import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse;

import java.time.LocalDate;

public interface PlatformAnalyticsOverviewService {
    PlatformAnalyticsOverviewResponse overview(String period, LocalDate from, LocalDate to);
}
