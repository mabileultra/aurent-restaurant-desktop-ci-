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
            && writeMode == CatalogWriteMode.CATALOG_PRIMARY
            && remoteReachable
            && outboxStats.map(s -> s.failed() == 0 && s.pending() == 0).orElse(false);

        String note;
        if (!properties.isEnabled()) {
            note = "Local SoT (app.catalog.enabled=false)";
        } else if (writeMode == CatalogWriteMode.CATALOG_PRIMARY) {
            note = soakRecommended
                ? "Wave 7 CATALOG_PRIMARY + REMOTE_ONLY read; verify before prod flip / drop"
                : "Wave 7 CATALOG_PRIMARY on — catalog card SoT; local mirror until drop";
        } else if (writeMode == CatalogWriteMode.REMOTE_ONLY) {
            note = "REMOTE_ONLY = strict mirror (local still writes first); not Wave 7 SoT";
        } else {
            note = "Soak DUAL; next Wave 7 dial write-mode=CATALOG_PRIMARY (not REMOTE_ONLY)";
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
