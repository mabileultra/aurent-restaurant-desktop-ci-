package com.pos.client.reporting;

import com.pos.dto.report.analytics.StoreStockInsightResponse;

import java.time.LocalDate;

public interface ReportingAnalyticsClient {

    StoreStockInsightResponse storeStockInsight(LocalDate from, LocalDate to);
}
