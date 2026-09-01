package com.pos.monitoring.ops;

import com.pos.dto.monitoring.OpsHealthInfo;
import com.pos.integrations.finance.repository.FinanceSyncOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OpsHealthSnapshotProvider {

    private final FinanceSyncOutboxRepository financeSyncOutboxRepository;

    @Value("${sentry.dsn:}")
    private String sentryDsn;

    public OpsHealthInfo snapshot() {
        long pending = financeSyncOutboxRepository.countByStatus("PENDING");
        long failed = financeSyncOutboxRepository.countByStatus("FAILED");
        boolean sentryEnabled = sentryDsn != null && !sentryDsn.isBlank();
        return new OpsHealthInfo(pending, failed, sentryEnabled);
    }
}
