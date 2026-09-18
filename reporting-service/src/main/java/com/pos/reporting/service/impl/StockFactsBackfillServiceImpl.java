package com.pos.reporting.service.impl;

import com.pos.reporting.service.ReportingIngestService;

import com.pos.reporting.service.StockFactsBackfillService;

import com.pos.reporting.client.PosReportingFactsClient;
import com.pos.reporting.dto.FactsBackfillResult;
import com.pos.reporting.dto.ShiftFactsPageResponse;
import com.pos.reporting.dto.StockFactsPageResponse;
import com.pos.shared.event.ShiftClosedEvent;
import com.pos.shared.event.StockReceivedEvent;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StockFactsBackfillServiceImpl implements StockFactsBackfillService {

    private static final int BATCH_SIZE = 200;

    private final PosReportingFactsClient posReportingFactsClient;
    private final ReportingIngestService reportingIngestService;

    @Override
    public FactsBackfillResult backfill(LocalDate from, LocalDate to) {
        long ingested = 0L;
        long skipped = 0L;
        int page = 0;
        int totalPages = 1;

        while (page < totalPages) {
            StockFactsPageResponse batch = posReportingFactsClient.fetchStockPage(from, to, page, BATCH_SIZE);
            if (batch == null || batch.content() == null || batch.content().isEmpty()) {
                break;
            }
            totalPages = Math.max(batch.totalPages(), 1);
            for (StockReceivedEvent event : batch.content()) {
                if (reportingIngestService.ingestStock(event)) {
                    ingested++;
                } else {
                    skipped++;
                }
            }
            page++;
        }

        LogUtil.info(StockFactsBackfillService.class, "Stock facts backfill: ingested={}, skipped={}", ingested, skipped);
        return new FactsBackfillResult(ingested, skipped, ingested + skipped);
    }
}
