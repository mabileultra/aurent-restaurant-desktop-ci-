package com.pos.integrations.finance.dto;

public record FinanceSyncBackfillResponse(
    int zReportsEnqueued,
    int purchasesEnqueued,
    int skipped
) {
}
