package com.pos.client.reporting;

import com.pos.dto.report.shift.ShiftOverviewResponse;

import java.time.LocalDate;

public interface ReportingShiftReportClient {

    ShiftOverviewResponse overview(LocalDate from, LocalDate to, int recentLimit);
}
