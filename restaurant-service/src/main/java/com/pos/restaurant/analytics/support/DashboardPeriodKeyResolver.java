package com.pos.restaurant.analytics.support;

import com.pos.restaurant.report.support.ReportPeriod;
import com.pos.shared.api.InstantRange;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

/**
 * Maps dashboard period query keys to concrete Instant windows.
 */
@Component
public class DashboardPeriodKeyResolver {

    private static final Set<String> KNOWN = Set.of(
        "TODAY", "YESTERDAY", "WEEK", "THIS_WEEK", "MONTH", "THIS_MONTH", "CUSTOM"
    );

    public record Resolved(String key, AnalyticsPeriodResolver.Period period) {
    }

    private final AnalyticsPeriodResolver periodResolver;

    public DashboardPeriodKeyResolver(AnalyticsPeriodResolver periodResolver) {
        this.periodResolver = periodResolver;
    }

    public Resolved resolve(String periodKey, Instant from, Instant to) {
        String raw = periodKey == null ? "TODAY" : periodKey.trim().toUpperCase(Locale.ROOT);
        String key = KNOWN.contains(raw) ? raw : "TODAY";
        if ("THIS_WEEK".equals(key)) {
            key = "WEEK";
        }
        if ("THIS_MONTH".equals(key)) {
            key = "MONTH";
        }
        AnalyticsPeriodResolver.Period period = switch (key) {
            case "YESTERDAY" -> periodResolver.yesterday();
            case "WEEK" -> periodResolver.thisWeek();
            case "MONTH" -> periodResolver.thisMonth();
            case "CUSTOM" -> custom(from, to);
            default -> periodResolver.today();
        };
        return new Resolved(key, period);
    }

    public AnalyticsPeriodResolver.Period previousOf(AnalyticsPeriodResolver.Period period) {
        return periodResolver.previousOf(period);
    }

    private AnalyticsPeriodResolver.Period custom(Instant from, Instant to) {
        if (from != null && to != null) {
            InstantRange range = ReportPeriod.require(from, to);
            return new AnalyticsPeriodResolver.Period(range.from(), range.to());
        }
        return periodResolver.today();
    }
}
