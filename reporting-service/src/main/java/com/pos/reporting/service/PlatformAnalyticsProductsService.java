package com.pos.reporting.service;

import com.pos.reporting.dto.platform.PlatformAnalyticsProductsResponse;

import java.time.LocalDate;

public interface PlatformAnalyticsProductsService {
    PlatformAnalyticsProductsResponse products(String period, LocalDate from, LocalDate to);
}
