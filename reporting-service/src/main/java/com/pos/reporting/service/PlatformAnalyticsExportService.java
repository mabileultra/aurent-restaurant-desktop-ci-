package com.pos.reporting.service;

import java.time.LocalDate;

public interface PlatformAnalyticsExportService {
    byte[] export(String view, String period, LocalDate from, LocalDate to);
}
