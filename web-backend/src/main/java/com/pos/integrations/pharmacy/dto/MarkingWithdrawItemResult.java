package com.pos.integrations.pharmacy.dto;

public record MarkingWithdrawItemResult(
    String code,
    boolean success,
    boolean pending,
    String status,
    String message
) {
    public static MarkingWithdrawItemResult ok(String code, String status) {
        return new MarkingWithdrawItemResult(code, true, false, status, null);
    }

    public static MarkingWithdrawItemResult waiting(String code, String status, String message) {
        return new MarkingWithdrawItemResult(code, false, true, status, message);
    }

    public static MarkingWithdrawItemResult fail(String code, String message) {
        return new MarkingWithdrawItemResult(code, false, false, null, message);
    }
}
