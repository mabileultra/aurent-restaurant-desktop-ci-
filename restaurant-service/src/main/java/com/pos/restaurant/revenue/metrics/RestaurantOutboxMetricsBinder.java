package com.pos.restaurant.revenue.metrics;

import com.pos.restaurant.revenue.repository.RevenueOutboxRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RestaurantOutboxMetricsBinder {

    private final MeterRegistry meterRegistry;
    private final RevenueOutboxRepository repository;

    @PostConstruct
    void bind() {
        Gauge.builder("pos.outbox.pending", repository, repo -> repo.countByStatus("PENDING"))
            .tag("service", "restaurant-service")
            .tag("outbox", "revenue")
            .register(meterRegistry);
        Gauge.builder("pos.outbox.failed", repository, repo -> repo.countByStatus("FAILED"))
            .tag("service", "restaurant-service")
            .tag("outbox", "revenue")
            .register(meterRegistry);
    }
}
