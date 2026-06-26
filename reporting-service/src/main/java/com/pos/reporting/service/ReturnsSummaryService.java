package com.pos.reporting.service;

import com.pos.reporting.dto.ReturnsSummaryResponse;

import java.time.LocalDate;

public interface ReturnsSummaryService {

    ReturnsSummaryResponse summary(LocalDate from, LocalDate to);
}
