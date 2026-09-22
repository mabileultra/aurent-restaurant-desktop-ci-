package com.pos.restaurant.analytics.support;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Locale;

/**
 * Maps dashboard period query keys to concrete Instant windows.
 */
@Component
public class DashboardPeriodKeyResolver {

    private final AnalyticsPeriodResolver periodResolver;

    public DashboardPeriodKeyResolver(AnalyticsPeriodResolver periodResolver) {
        this.periodResolver = periodResolver;
    }

    public AnalyticsPeriodResolver.Period resolve(String periodKey, Instant from, Instant to) {
        String key = periodKey == null ? "TODAY" : periodKey.trim().toUpperCase(Locale.ROOT);
        return switch (key) {
            case "YESTERDAY" -> periodResolver.yesterday();
            case "WEEK", "THIS_WEEK" -> periodResolver.thisWeek();
            case "MONTH", "THIS_MONTH" -> periodResolver.thisMonth();
            case "CUSTOM" -> periodResolver.resolve(from, to);
            default -> periodResolver.today();
        };
    }

    public AnalyticsPeriodResolver.Period previousOf(AnalyticsPeriodResolver.Period period) {
        return periodResolver.previousOf(period);
    }
}
