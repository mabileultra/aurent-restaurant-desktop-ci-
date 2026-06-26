package com.pos.reporting.service;

import com.pos.reporting.dto.DailySummaryResponse;
import java.time.LocalDate;

public interface DailySummaryService {

    DailySummaryResponse dailySummary(LocalDate date);
}

