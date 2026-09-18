package com.pos.pharmacy.revenue.metrics;

import com.pos.pharmacy.revenue.repository.RevenueOutboxRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PharmacyOutboxMetricsBinder {

    private final MeterRegistry meterRegistry;
    private final RevenueOutboxRepository repository;

    @PostConstruct
    void bind() {
        Gauge.builder("pos.outbox.pending", repository, repo -> repo.countByStatus("PENDING"))
            .tag("service", "pharmacy-service")
            .tag("outbox", "revenue")
            .register(meterRegistry);
        Gauge.builder("pos.outbox.failed", repository, repo -> repo.countByStatus("FAILED"))
            .tag("service", "pharmacy-service")
            .tag("outbox", "revenue")
            .register(meterRegistry);
    }
}
