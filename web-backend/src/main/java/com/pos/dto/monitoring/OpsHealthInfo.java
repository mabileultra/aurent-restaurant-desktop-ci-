package com.pos.dto.monitoring;

/**
 * Operational signals for the super-admin monitoring dashboard.
 */
public record OpsHealthInfo(
    long financeOutboxPending,
    long financeOutboxFailed,
    boolean sentryEnabled
) {
}
