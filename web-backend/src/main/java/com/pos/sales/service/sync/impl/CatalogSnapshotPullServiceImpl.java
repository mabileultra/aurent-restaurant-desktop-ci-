package com.pos.sales.service.sync.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.client.catalog.CatalogRemoteOutboxRow;
import com.pos.client.catalog.CatalogServiceClient;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.sales.dto.sync.CatalogSnapshotPullResponse;
import com.pos.sales.service.sync.CatalogSnapshotPullService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CatalogSnapshotPullServiceImpl implements CatalogSnapshotPullService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final CatalogServiceProperties catalogProperties;
    private final CatalogServiceClient catalogServiceClient;
    private final ObjectMapper objectMapper;

    @Override
    public CatalogSnapshotPullResponse pull(Integer companyId, Instant since, int limit) {
        if (!catalogProperties.isEnabled()) {
            return CatalogSnapshotPullResponse.empty(false);
        }
        int size = Math.min(Math.max(limit, 1), 100);
        Instant safeSince = since != null ? since : Instant.EPOCH;
        List<CatalogRemoteOutboxRow> rows = catalogServiceClient.fetchOutboxFeed(safeSince, size);
        List<Map<String, Object>> events = new ArrayList<>();
        for (CatalogRemoteOutboxRow row : rows) {
            if (companyId != null && row.companyId() != null && !companyId.equals(row.companyId())) {
                continue;
            }
            Map<String, Object> event = parsePayload(row);
            if (event != null) {
                events.add(event);
            }
        }
        LogUtil.info(
            CatalogSnapshotPullServiceImpl.class,
            "catalog snapshot pull companyId={} since={} feed={} events={}",
            companyId,
            safeSince,
            rows.size(),
            events.size()
        );
        return new CatalogSnapshotPullResponse(events, Instant.now(), true);
    }

    private Map<String, Object> parsePayload(CatalogRemoteOutboxRow row) {
        try {
            return objectMapper.readValue(row.payload(), MAP_TYPE);
        } catch (Exception ex) {
            LogUtil.warn(
                CatalogSnapshotPullServiceImpl.class,
                "bad catalog outbox payload id=" + row.id(),
                ex
            );
            return null;
        }
    }
}
