package com.pos.reporting.service.impl;

import com.pos.reporting.client.PosReportingFactsClient;
import com.pos.reporting.dto.FactsBackfillResult;
import com.pos.reporting.dto.InventoryFactsPageResponse;
import com.pos.reporting.service.InventoryFactsBackfillService;
import com.pos.reporting.service.ReportingIngestService;
import com.pos.shared.log.LogUtil;
import com.pos.shared.event.StockInventoryRecordedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class InventoryFactsBackfillServiceImpl implements InventoryFactsBackfillService {

    private static final int BATCH_SIZE = 200;

    private final PosReportingFactsClient posReportingFactsClient;
    private final ReportingIngestService reportingIngestService;

    @Override
    public FactsBackfillResult backfill(LocalDate from, LocalDate to, String authorization) {
        long ingested = 0L;
        long skipped = 0L;
        int page = 0;
        int totalPages = 1;

        while (page < totalPages) {
            InventoryFactsPageResponse batch = posReportingFactsClient.fetchInventoryPage(
                from, to, page, BATCH_SIZE, authorization
            );
            if (batch == null || batch.content() == null || batch.content().isEmpty()) {
                break;
            }
            totalPages = Math.max(batch.totalPages(), 1);
            for (StockInventoryRecordedEvent event : batch.content()) {
                if (reportingIngestService.ingestInventory(event)) {
                    ingested++;
                } else {
                    skipped++;
                }
            }
            page++;
        }

        LogUtil.info(
            InventoryFactsBackfillService.class,
            "Inventory facts backfill: ingested={}, skipped={}",
            ingested,
            skipped
        );
        return new FactsBackfillResult(ingested, skipped, ingested + skipped);
    }
}
