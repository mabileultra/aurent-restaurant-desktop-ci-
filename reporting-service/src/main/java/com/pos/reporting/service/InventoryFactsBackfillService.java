package com.pos.reporting.service;

import com.pos.reporting.dto.FactsBackfillResult;

import java.time.LocalDate;

public interface InventoryFactsBackfillService {

    FactsBackfillResult backfill(LocalDate from, LocalDate to, String authorization);
}
