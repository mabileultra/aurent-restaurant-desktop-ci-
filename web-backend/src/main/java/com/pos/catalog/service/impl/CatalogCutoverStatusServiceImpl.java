package com.pos.catalog.service.impl;

import com.pos.catalog.dto.product.CatalogCutoverStatusResponse;
import com.pos.catalog.service.CatalogCutoverStatusService;
import com.pos.client.catalog.CatalogRemoteOutboxStats;
import com.pos.client.catalog.CatalogRemoteStats;
import com.pos.client.catalog.CatalogServiceClient;
import com.pos.config.catalog.CatalogReadMode;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.config.catalog.CatalogWriteMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CatalogCutoverStatusServiceImpl implements CatalogCutoverStatusService {

    private final CatalogServiceProperties properties;
    private final CatalogServiceClient catalogServiceClient;

    @Override
    public CatalogCutoverStatusResponse status(Integer companyId) {
        CatalogReadMode readMode = properties.effectiveReadMode();
        CatalogWriteMode writeMode = properties.effectiveWriteMode();
        Optional<CatalogRemoteStats> productStats = properties.isEnabled()
            ? catalogServiceClient.fetchStats(companyId)
            : Optional.empty();
        Optional<CatalogRemoteOutboxStats> outboxStats = properties.isEnabled()
            ? catalogServiceClient.fetchOutboxStats()
            : Optional.empty();

        boolean remoteReachable = productStats.isPresent() || outboxStats.isPresent();
        boolean soakRecommended = properties.isEnabled()
            && readMode == CatalogReadMode.REMOTE_ONLY
            && writeMode == CatalogWriteMode.REMOTE_ONLY
            && remoteReachable
            && outboxStats.map(s -> s.failed() == 0 && s.pending() == 0).orElse(false);

        String note;
        if (!properties.isEnabled()) {
            note = "Local SoT (app.catalog.enabled=false)";
        } else if (soakRecommended) {
            note = "Modes + outbox look ready for soak; run /verify before REMOTE_ONLY prod";
        } else {
            note = "Enable backfill/verify; prefer read-mode=REMOTE_ONLY + write-mode=REMOTE_ONLY with empty outbox";
        }

        return new CatalogCutoverStatusResponse(
            properties.isEnabled(),
            readMode.name(),
            writeMode.name(),
            properties.strictRemoteWrite(),
            remoteReachable,
            productStats.map(CatalogRemoteStats::total).orElse(null),
            productStats.map(CatalogRemoteStats::active).orElse(null),
            outboxStats.map(CatalogRemoteOutboxStats::pending).orElse(null),
            outboxStats.map(CatalogRemoteOutboxStats::published).orElse(null),
            outboxStats.map(CatalogRemoteOutboxStats::failed).orElse(null),
            soakRecommended,
            note
        );
    }
}
