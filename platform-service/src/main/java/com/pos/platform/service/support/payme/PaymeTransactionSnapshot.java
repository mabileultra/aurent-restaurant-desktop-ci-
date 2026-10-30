package com.pos.platform.service.support.payme;

import com.pos.platform.entity.BillingPaymentIntent;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Map;

/**
 * Состояние Payme-транзакции для Check/Create/Cancel/GetStatement.
 */
public record PaymeTransactionSnapshot(
    int state,
    Integer reason,
    long createTimeMs,
    long performTimeMs,
    long cancelTimeMs
) {
    public static final int STATE_CREATED = 1;
    public static final int STATE_DONE = 2;
    public static final int STATE_CANCELLED = -1;
    public static final int STATE_CANCELLED_AFTER = -2;
    public static final int REASON_CANCEL_BEFORE = 3;
    public static final int REASON_CANCEL_AFTER = 5;

    public static PaymeTransactionSnapshot of(BillingPaymentIntent intent) {
        long createTimeMs = resolveStoredCreateTime(intent);
        long performTimeMs = intent.getPaidAt() != null ? intent.getPaidAt().toEpochMilli() : 0L;
        return switch (intent.getStatus()) {
            case PAID -> new PaymeTransactionSnapshot(STATE_DONE, null, createTimeMs, performTimeMs, 0L);
            case CANCELLED, FAILED -> cancelled(intent, createTimeMs, performTimeMs);
            default -> new PaymeTransactionSnapshot(STATE_CREATED, null, createTimeMs, 0L, 0L);
        };
    }

    public static int resolveCancelReason(Map<String, Object> params, boolean afterPerform) {
        Integer reason = PaymeParamCodec.parseReason(params.get("reason"));
        if (reason != null) {
            return reason;
        }
        return afterPerform ? REASON_CANCEL_AFTER : REASON_CANCEL_BEFORE;
    }

    public static long resolveIncomingCreateTime(Map<String, Object> params) {
        Instant fromParams = PaymeParamCodec.millisToInstant(params.get("time"));
        if (fromParams != null) {
            return fromParams.toEpochMilli();
        }
        return Instant.now().toEpochMilli();
    }

    private static PaymeTransactionSnapshot cancelled(
        BillingPaymentIntent intent,
        long createTimeMs,
        long performTimeMs
    ) {
        boolean afterPerform = intent.getPaidAt() != null;
        int state = afterPerform ? STATE_CANCELLED_AFTER : STATE_CANCELLED;
        Integer reason = intent.getPaymeCancelReason() != null
            ? intent.getPaymeCancelReason()
            : (afterPerform ? REASON_CANCEL_AFTER : REASON_CANCEL_BEFORE);
        long cancelTimeMs = intent.getPaymeCancelledAt() != null
            ? intent.getPaymeCancelledAt().toEpochMilli()
            : intent.getUpdatedAt().toEpochMilli();
        return new PaymeTransactionSnapshot(state, reason, createTimeMs, performTimeMs, cancelTimeMs);
    }

    private static long resolveStoredCreateTime(BillingPaymentIntent intent) {
        String raw = intent.getProviderPrepareId();
        if (StringUtils.hasText(raw)) {
            try {
                return Long.parseLong(raw.trim());
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return intent.getCreatedAt() != null
            ? intent.getCreatedAt().toEpochMilli()
            : Instant.now().toEpochMilli();
    }
}
