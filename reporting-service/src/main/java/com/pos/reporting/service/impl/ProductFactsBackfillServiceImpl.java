package com.pos.reporting.service.impl;

import com.pos.reporting.client.PosReportingFactsClient;
import com.pos.reporting.dto.FactsBackfillResult;
import com.pos.reporting.dto.ProductFactsPageResponse;
import com.pos.reporting.service.ProductFactsBackfillService;
import com.pos.reporting.service.ReportingIngestService;
import com.pos.shared.log.LogUtil;
import com.pos.shared.event.ProductSnapshotEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductFactsBackfillServiceImpl implements ProductFactsBackfillService {

    private static final int BATCH_SIZE = 200;

    private final PosReportingFactsClient posReportingFactsClient;
    private final ReportingIngestService reportingIngestService;

    @Override
    public FactsBackfillResult backfill(String authorization) {
        long ingested = 0L;
        long skipped = 0L;
        int page = 0;
        int totalPages = 1;

        while (page < totalPages) {
            ProductFactsPageResponse batch = posReportingFactsClient.fetchProductSnapshotPage(
                page, BATCH_SIZE, authorization
            );
            if (batch == null || batch.content() == null || batch.content().isEmpty()) {
                break;
            }
            totalPages = Math.max(batch.totalPages(), 1);
            for (ProductSnapshotEvent event : batch.content()) {
                if (reportingIngestService.ingestProduct(event)) {
                    ingested++;
                } else {
                    skipped++;
                }
            }
            page++;
        }

        LogUtil.info(
            ProductFactsBackfillService.class,
            "Product snapshot facts backfill: ingested={}, skipped={}",
            ingested,
            skipped
        );
        return new FactsBackfillResult(ingested, skipped, ingested + skipped);
    }
}
