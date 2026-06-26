package com.pos.reporting.service;

import com.pos.reporting.dto.SalesSummaryResponse;
import java.time.LocalDate;

public interface SalesSummaryService {

    SalesSummaryResponse summary(Integer companyId, LocalDate from, LocalDate to);
}

