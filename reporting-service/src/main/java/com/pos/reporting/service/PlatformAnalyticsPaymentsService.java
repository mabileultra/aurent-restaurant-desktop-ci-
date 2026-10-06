package com.pos.reporting.service;

import com.pos.reporting.dto.platform.PlatformAnalyticsPaymentsResponse;

import java.time.LocalDate;

public interface PlatformAnalyticsPaymentsService {
    PlatformAnalyticsPaymentsResponse payments(String period, LocalDate from, LocalDate to);
}
