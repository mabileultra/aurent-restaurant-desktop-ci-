package com.pos.reporting.service;

import com.pos.reporting.dto.platform.PlatformAnalyticsFiscalResponse;

import java.time.LocalDate;

public interface PlatformAnalyticsFiscalService {
    PlatformAnalyticsFiscalResponse fiscal(String period, LocalDate from, LocalDate to);
}
