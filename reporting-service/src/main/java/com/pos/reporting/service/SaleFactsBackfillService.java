package com.pos.reporting.service;

import com.pos.reporting.dto.FactsBackfillResult;
import java.time.LocalDate;

public interface SaleFactsBackfillService {

    FactsBackfillResult backfill(LocalDate from, LocalDate to);
}

