package com.pos.reporting.service.impl;

import com.pos.reporting.client.PosReportingFactsClient;
import com.pos.reporting.dto.FactsBackfillResult;
import com.pos.reporting.dto.TransferFactsPageResponse;
import com.pos.reporting.service.ReportingIngestService;
import com.pos.reporting.service.TransferFactsBackfillService;
import com.pos.shared.log.LogUtil;
import com.pos.shared.event.StockTransferRecordedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TransferFactsBackfillServiceImpl implements TransferFactsBackfillService {

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
            TransferFactsPageResponse batch = posReportingFactsClient.fetchTransferPage(
                from, to, page, BATCH_SIZE
            );
            if (batch == null || batch.content() == null || batch.content().isEmpty()) {
                break;
            }
            totalPages = Math.max(batch.totalPages(), 1);
            for (StockTransferRecordedEvent event : batch.content()) {
                if (reportingIngestService.ingestTransfer(event)) {
                    ingested++;
                } else {
                    skipped++;
                }
            }
            page++;
        }

        LogUtil.info(
            TransferFactsBackfillService.class,
            "Transfer facts backfill: ingested={}, skipped={}",
            ingested,
            skipped
        );
        return new FactsBackfillResult(ingested, skipped, ingested + skipped);
    }
}
