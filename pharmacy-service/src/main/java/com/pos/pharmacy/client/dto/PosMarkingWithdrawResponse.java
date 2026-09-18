package com.pos.pharmacy.client.dto;

import java.util.List;

public record PosMarkingWithdrawResponse(
    List<PosMarkingWithdrawItem> results,
    int succeeded,
    int pending,
    int failed
) {
}
