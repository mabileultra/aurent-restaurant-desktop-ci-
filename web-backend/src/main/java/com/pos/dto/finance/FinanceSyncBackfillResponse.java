package com.pos.dto.finance;

public record FinanceSyncBackfillResponse(
    int zReportsEnqueued,
    int purchasesEnqueued,
    int skipped
) {
}
