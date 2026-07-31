package com.pos.ai.service.support;

import java.time.Instant;
import java.time.LocalDate;

public final class AnalyticsPeriodSupport {

    public static final java.time.ZoneId ZONE = com.pos.ai.support.TashkentPeriod.TASHKENT;

    private AnalyticsPeriodSupport() {
    }

    public record Period(LocalDate from, LocalDate to, Instant start, Instant end) {
    }

    public static Period period(LocalDate from, LocalDate to, int defaultDaysBack) {
        LocalDate safeTo = to != null ? to : com.pos.ai.support.TashkentPeriod.today();
        LocalDate safeFrom = from != null ? from : safeTo.minusDays(defaultDaysBack);
        
        Instant start = safeFrom.atStartOfDay(ZONE).toInstant();
        Instant end = safeTo.plusDays(1).atStartOfDay(ZONE).toInstant();
        
        return new Period(safeFrom, safeTo, start, end);
    }

    public static LocalDate today() {
        return com.pos.ai.support.TashkentPeriod.today();
    }
}
