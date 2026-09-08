package com.pos.platform.service.support;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

public final class BillingTime {

    public static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");
    public static final int PERIOD_DAYS = 30;
    public static final int MAX_CATCH_UP_PERIODS = 36;

    private BillingTime() {}

    public static Instant startOfDay(LocalDate date) {
        return date.atStartOfDay(ZONE).toInstant();
    }
}
