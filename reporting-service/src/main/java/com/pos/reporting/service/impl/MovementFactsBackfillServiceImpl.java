package com.pos.reporting.service.impl;

import com.pos.reporting.client.PosReportingFactsClient;
import com.pos.reporting.dto.FactsBackfillResult;
import com.pos.reporting.dto.MovementFactsPageResponse;
import com.pos.reporting.service.MovementFactsBackfillService;
import com.pos.reporting.service.ReportingIngestService;
import com.pos.shared.log.LogUtil;
import com.pos.shared.event.StockMovementRecordedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class MovementFactsBackfillServiceImpl implements MovementFactsBackfillService {

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
            MovementFactsPageResponse batch = posReportingFactsClient.fetchMovementPage(
                from, to, page, BATCH_SIZE
            );
            if (batch == null || batch.content() == null || batch.content().isEmpty()) {
                break;
            }
            totalPages = Math.max(batch.totalPages(), 1);
            for (StockMovementRecordedEvent event : batch.content()) {
                if (reportingIngestService.ingestMovement(event)) {
                    ingested++;
                } else {
                    skipped++;
                }
            }
            page++;
        }

        LogUtil.info(
            MovementFactsBackfillService.class,
            "Movement facts backfill: ingested={}, skipped={}",
            ingested,
            skipped
        );
        return new FactsBackfillResult(ingested, skipped, ingested + skipped);
    }
}
