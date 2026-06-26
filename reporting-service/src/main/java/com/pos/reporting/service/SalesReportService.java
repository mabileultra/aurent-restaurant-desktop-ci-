package com.pos.reporting.service;

import com.pos.reporting.dto.SalesReportResponse;
import java.time.LocalDate;

public interface SalesReportService {

    SalesReportResponse salesReport(LocalDate from, LocalDate to);
}

