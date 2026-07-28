package com.pos.integrations.finance.service;

import com.pos.integrations.finance.dto.FinanceSyncBackfillResponse;

import java.time.LocalDate;
import java.util.Set;

public interface FinanceSyncBackfillService {

    FinanceSyncBackfillResponse backfill(LocalDate from, LocalDate to, Set<String> types);
}
