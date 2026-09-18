package com.pos.integrations.finance.metrics;

import com.pos.integrations.finance.repository.FinanceSyncOutboxRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FinanceOutboxMetricsBinder {

    private final MeterRegistry meterRegistry;
    private final FinanceSyncOutboxRepository repository;

    @PostConstruct
    void bind() {
        Gauge.builder("pos.outbox.pending", repository, repo -> repo.countByStatus("PENDING"))
            .tag("service", "web-backend")
            .tag("outbox", "finance_sync")
            .register(meterRegistry);
        Gauge.builder("pos.outbox.failed", repository, repo -> repo.countByStatus("FAILED"))
            .tag("service", "web-backend")
            .tag("outbox", "finance_sync")
            .register(meterRegistry);
    }
}
