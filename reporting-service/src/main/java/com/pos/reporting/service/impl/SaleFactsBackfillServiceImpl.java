package com.pos.reporting.service.impl;

import com.pos.reporting.service.ReportingIngestService;

import com.pos.reporting.service.SaleFactsBackfillService;

import com.pos.reporting.dto.FactsBackfillResult;
import com.pos.reporting.dto.SaleFactsPageResponse;
import com.pos.reporting.client.PosSaleFactsClient;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class SaleFactsBackfillServiceImpl implements SaleFactsBackfillService {

    private static final int BATCH_SIZE = 200;

    private final PosSaleFactsClient posSaleFactsClient;
    private final ReportingIngestService reportingIngestService;

    @Override
    public FactsBackfillResult backfill(LocalDate from, LocalDate to, String authorization) {
        long ingested = 0L;
        long skipped = 0L;
        int page = 0;
        int totalPages = 1;

        while (page < totalPages) {
            SaleFactsPageResponse batch = posSaleFactsClient.fetchPage(from, to, page, BATCH_SIZE, authorization);
            if (batch == null || batch.content() == null || batch.content().isEmpty()) {
                break;
            }
            totalPages = Math.max(batch.totalPages(), 1);
            for (SaleCompletedEvent event : batch.content()) {
                if (reportingIngestService.ingestSale(event)) {
                    ingested++;
                } else {
                    skipped++;
                }
            }
            page++;
        }

        long totalProcessed = ingested + skipped;
        LogUtil.info(
            SaleFactsBackfillService.class,
            "Sale facts backfill completed: ingested={}, skipped={}, from={}, to={}",
            ingested, skipped, from, to
        );
        return new FactsBackfillResult(ingested, skipped, totalProcessed);
    }
}
