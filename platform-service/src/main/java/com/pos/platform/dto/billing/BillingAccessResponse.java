package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingAccountStatus;

import java.time.Instant;

public record BillingAccessResponse(
    Integer companyId,
    boolean billingEnabled,
    boolean accessAllowed,
    BillingAccountStatus status,
    /** Мягкое напоминание об оплате (не жёсткая блокировка). */
    boolean paymentNoticeRequired,
    String noticeKind,
    Instant nextChargeAt,
    Instant graceUntil,
    Integer graceDaysLeft
) {
    public BillingAccessResponse(
        Integer companyId,
        boolean billingEnabled,
        boolean accessAllowed,
        BillingAccountStatus status
    ) {
        this(companyId, billingEnabled, accessAllowed, status, false, null, null, null, null);
    }
}
