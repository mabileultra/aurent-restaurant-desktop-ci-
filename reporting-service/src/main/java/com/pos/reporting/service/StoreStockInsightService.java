package com.pos.reporting.service;

import com.pos.reporting.dto.analytics.StoreStockInsightResponse;

import java.time.LocalDate;

public interface StoreStockInsightService {

    StoreStockInsightResponse insight(LocalDate from, LocalDate to);
}
