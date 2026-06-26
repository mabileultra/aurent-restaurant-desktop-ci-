package com.pos.reporting.dto;

public record ReportingBackfillResponse(
    FactsBackfillResult sales,
    FactsBackfillResult stock,
    FactsBackfillResult movements,
    FactsBackfillResult shifts,
    FactsBackfillResult products,
    FactsBackfillResult inventories,
    FactsBackfillResult transfers
) {}
