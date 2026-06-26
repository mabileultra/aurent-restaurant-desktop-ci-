package com.pos.reporting.service;

import com.pos.reporting.dto.shift.ShiftOverviewResponse;

import java.time.LocalDate;

public interface ShiftReportService {

    ShiftOverviewResponse overview(LocalDate from, LocalDate to, int recentLimit);
}
