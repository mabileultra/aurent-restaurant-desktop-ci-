package com.pos.reporting.service;

import com.pos.reporting.dto.PeriodCompareResponse;
import java.time.LocalDate;

public interface PeriodCompareService {

    PeriodCompareResponse compare(LocalDate from, LocalDate to, Integer storeId);
}

