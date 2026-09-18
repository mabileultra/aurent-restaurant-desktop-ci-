package com.pos.pharmacy.client.dto;

public record PosMarkingWithdrawItem(
    String code,
    boolean success,
    boolean pending,
    String status,
    String message
) {
}
