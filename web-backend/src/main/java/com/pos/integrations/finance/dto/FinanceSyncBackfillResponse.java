package com.pos.integrations.finance.dto;

public record FinanceSyncBackfillResponse(
    int zReportsEnqueued,
    int purchasesEnqueued,
    int salesEnqueued,
    int skipped
) {
    public FinanceSyncBackfillResponse(int zReportsEnqueued, int purchasesEnqueued, int skipped) {
        this(zReportsEnqueued, purchasesEnqueued, 0, skipped);
    }
}
