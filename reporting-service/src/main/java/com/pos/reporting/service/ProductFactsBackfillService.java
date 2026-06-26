package com.pos.reporting.service;

import com.pos.reporting.dto.FactsBackfillResult;

public interface ProductFactsBackfillService {

    FactsBackfillResult backfill(String authorization);
}
