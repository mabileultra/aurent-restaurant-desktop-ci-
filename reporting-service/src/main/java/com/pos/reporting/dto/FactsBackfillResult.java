package com.pos.reporting.dto;

public record FactsBackfillResult(
    long ingested,
    long skipped,
    long totalProcessed
) {}
