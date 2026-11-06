package com.pos.taxanalytics.service.impl;

import com.pos.exception.PosExceptions;
import com.pos.taxanalytics.dto.TaxAnalyticsExportItemResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsExportRepository;
import com.pos.taxanalytics.service.TaxAnalyticsReportService;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaxAnalyticsExportServiceImpl {

    private final TaxAnalyticsReportService reportService;
    private final TaxAnalyticsExportRepository repository;

    @Transactional
    public String exportAndRemember(String period, LocalDate from, LocalDate to) {
        TaxAnalyticsPeriod range = TaxAnalyticsPeriod.resolve(period, from, to);
        String csv = reportService.exportCsv(period, from, to);
        repository.insert(UUID.randomUUID(), range.from(), range.to(), "tax-analytics.csv", csv);
        return csv;
    }

    @Transactional(readOnly = true)
    public List<TaxAnalyticsExportItemResponse> history() {
        List<TaxAnalyticsExportItemResponse> items = new ArrayList<>();
        for (Map<String, Object> row : repository.list()) {
            items.add(new TaxAnalyticsExportItemResponse(
                String.valueOf(row.get("id")),
                String.valueOf(row.get("created_at")),
                String.valueOf(row.get("period_from")),
                String.valueOf(row.get("period_to")),
                String.valueOf(row.get("filename"))
            ));
        }
        return items;
    }

    @Transactional(readOnly = true)
    public String csv(UUID id) {
        String csv = repository.csv(id);
        if (csv == null) {
            throw PosExceptions.notFound("Export", id);
        }
        return csv;
    }
}
