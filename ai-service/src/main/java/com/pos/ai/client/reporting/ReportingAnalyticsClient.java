package com.pos.ai.client.reporting;

import com.pos.ai.dto.report.analytics.StoreStockInsightResponse;

import java.time.LocalDate;

public interface ReportingAnalyticsClient {

    StoreStockInsightResponse storeStockInsight(LocalDate from, LocalDate to);
}
