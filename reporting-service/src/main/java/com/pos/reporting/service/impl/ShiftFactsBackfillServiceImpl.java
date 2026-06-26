package com.pos.reporting.service.impl;

import com.pos.reporting.service.ReportingIngestService;

import com.pos.reporting.service.ShiftFactsBackfillService;

import com.pos.reporting.client.PosReportingFactsClient;
import com.pos.reporting.dto.FactsBackfillResult;
import com.pos.reporting.dto.ShiftFactsPageResponse;
import com.pos.shared.event.ShiftClosedEvent;
import com.pos.reporting.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ShiftFactsBackfillServiceImpl implements ShiftFactsBackfillService {

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
            ShiftFactsPageResponse batch = posReportingFactsClient.fetchShiftPage(from, to, page, BATCH_SIZE, authorization);
            if (batch == null || batch.content() == null || batch.content().isEmpty()) {
                break;
            }
            totalPages = Math.max(batch.totalPages(), 1);
            for (ShiftClosedEvent event : batch.content()) {
                if (reportingIngestService.ingestShift(event)) {
                    ingested++;
                } else {
                    skipped++;
                }
            }
            page++;
        }

        LogUtil.info(ShiftFactsBackfillService.class, "Shift facts backfill: ingested={}, skipped={}", ingested, skipped);
        return new FactsBackfillResult(ingested, skipped, ingested + skipped);
    }
}
