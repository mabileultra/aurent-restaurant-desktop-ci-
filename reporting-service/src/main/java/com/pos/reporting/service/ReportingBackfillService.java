package com.pos.reporting.service;

import com.pos.reporting.dto.ReportingBackfillResponse;
import java.time.LocalDate;

public interface ReportingBackfillService {

    ReportingBackfillResponse backfill(LocalDate from, LocalDate to, String types);
}

