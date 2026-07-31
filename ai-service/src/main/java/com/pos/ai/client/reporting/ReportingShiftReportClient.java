package com.pos.ai.client.reporting;

import com.pos.ai.dto.report.shift.ShiftOverviewResponse;

import java.time.LocalDate;

public interface ReportingShiftReportClient {

    ShiftOverviewResponse overview(LocalDate from, LocalDate to, int recentLimit);
}
