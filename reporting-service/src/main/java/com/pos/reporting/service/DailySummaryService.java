package com.pos.reporting.service;

import com.pos.reporting.dto.DailySummaryResponse;
import java.time.LocalDate;

public interface DailySummaryService {

    default DailySummaryResponse dailySummary(LocalDate date) {
        return dailySummary(date, null);
    }

    DailySummaryResponse dailySummary(LocalDate date, Integer storeId);
}

