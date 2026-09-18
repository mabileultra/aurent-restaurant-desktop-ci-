package com.pos.integrations.pharmacy.dto;

import java.util.List;

public record MarkingWithdrawResponse(
    List<MarkingWithdrawItemResult> results,
    int succeeded,
    int pending,
    int failed
) {
}
