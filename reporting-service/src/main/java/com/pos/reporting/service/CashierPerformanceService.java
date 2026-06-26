package com.pos.reporting.service;

import com.pos.reporting.dto.CashierStatResponse;
import java.time.LocalDate;
import java.util.List;

public interface CashierPerformanceService {

    List<CashierStatResponse> performance(LocalDate from, LocalDate to);
}

