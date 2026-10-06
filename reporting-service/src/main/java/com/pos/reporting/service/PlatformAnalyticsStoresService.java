package com.pos.reporting.service;

import com.pos.reporting.dto.platform.PlatformAnalyticsStoresResponse;

import java.time.LocalDate;

public interface PlatformAnalyticsStoresService {
    PlatformAnalyticsStoresResponse stores(String period, LocalDate from, LocalDate to);
}
