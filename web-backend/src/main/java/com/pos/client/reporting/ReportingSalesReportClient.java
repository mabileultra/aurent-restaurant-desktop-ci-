package com.pos.client.reporting;

import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.ReturnsSummaryResponse;
import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.TopProductRow;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.dto.shared.PageResponse;

import java.time.LocalDate;
import java.util.List;

public interface ReportingSalesReportClient {

    SalesReportResponse salesReport(LocalDate from, LocalDate to);

    PageResponse<StoreSalesRowResponse> salesByStores(LocalDate from, LocalDate to, int page, int size);

    List<TopProductRow> topProducts(int limit, LocalDate from, LocalDate to);

    DailySummaryResponse dailySummary(LocalDate date);

    ReturnsSummaryResponse returnsSummary(LocalDate from, LocalDate to);
}
