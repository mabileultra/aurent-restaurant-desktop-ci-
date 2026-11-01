package com.pos.restaurant.report.support;

import com.pos.restaurant.analytics.support.AnalyticsPeriodResolver;
import com.pos.shared.api.InstantRange;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Resolves from/to for restaurant reports: validated range when both set, else analytics defaults.
 */
@Component
@RequiredArgsConstructor
public class StorePeriodSupport {

    private final AnalyticsPeriodResolver periodResolver;

    public InstantRange resolve(Instant from, Instant to) {
        if (from != null && to != null) {
            return ReportPeriod.require(from, to);
        }
        AnalyticsPeriodResolver.Period period = periodResolver.resolve(from, to);
        return new InstantRange(period.from(), period.to());
    }
}
