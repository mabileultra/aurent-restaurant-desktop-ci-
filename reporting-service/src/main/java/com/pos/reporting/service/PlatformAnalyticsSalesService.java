package com.pos.reporting.service;

import com.pos.reporting.dto.platform.PlatformAnalyticsSalesResponse;

import java.time.LocalDate;

public interface PlatformAnalyticsSalesService {
    PlatformAnalyticsSalesResponse sales(String period, LocalDate from, LocalDate to);
}
