package com.pos.restaurant.edge.service;

import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCloudSyncScheduler {

    private final EdgeCloudSyncService syncService;

    @Scheduled(fixedDelayString = "${app.restaurant.edge.sync-interval-ms:60000}")
    public void autoPush() {
        Map<String, Object> status = syncService.status();
        if (!Boolean.TRUE.equals(status.get("cloudConfigured"))) {
            return;
        }
        long pending = ((Number) status.getOrDefault("pending", 0)).longValue()
            + ((Number) status.getOrDefault("failed", 0)).longValue();
        if (pending <= 0) {
            return;
        }
        Map<String, Object> result = syncService.pushPendingBatch();
        Object pushed = result.get("pushed");
        if (pushed instanceof Number n && n.intValue() > 0) {
            LogUtil.info(EdgeCloudSyncScheduler.class, "Edge auto-sync pushed {} events", n.intValue());
        } else if (result.get("error") != null) {
            LogUtil.warn(EdgeCloudSyncScheduler.class, "Edge auto-sync: {}", result.get("error"));
        }
    }
}
