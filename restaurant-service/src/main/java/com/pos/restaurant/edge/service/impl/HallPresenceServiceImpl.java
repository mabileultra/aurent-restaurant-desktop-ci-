package com.pos.restaurant.edge.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.edge.dto.HallPresenceHeartbeatRequest;
import com.pos.restaurant.edge.service.HallPresenceService;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.security.RestaurantTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Hall PC heartbeats while cloud-reachable; phones poll and get switchToLan when stale/offline.
 */
@Service
@RequiredArgsConstructor
public class HallPresenceServiceImpl implements HallPresenceService {

    static final Duration STALE_AFTER = Duration.ofSeconds(45);

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public Map<String, Object> heartbeat(HallPresenceHeartbeatRequest request) {
        if (request == null || request.storeIds() == null || request.storeIds().isEmpty()) {
            throw new BusinessException("storeIds required");
        }
        Integer ctxCompany = RestaurantTenantContext.getCompanyId();
        Integer companyId = request.companyId() != null ? request.companyId() : ctxCompany;
        if (companyId == null) {
            throw new BusinessException("companyId required");
        }
        if (ctxCompany != null && !Objects.equals(ctxCompany, companyId)) {
            throw new BusinessException("Company mismatch");
        }
        boolean cloudOnline = request.cloudOnline() == null || Boolean.TRUE.equals(request.cloudOnline());
        String urlsJson = toUrlsJson(request.lanHubUrls());
        Instant now = Instant.now();
        int upserted = 0;
        for (Integer storeId : request.storeIds()) {
            if (storeId == null) continue;
            upserted += jdbc.update("""
                INSERT INTO rst_hall_presence (
                  store_id, company_id, cloud_online, lan_hub_urls_json, heartbeat_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (store_id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  cloud_online = EXCLUDED.cloud_online,
                  lan_hub_urls_json = EXCLUDED.lan_hub_urls_json,
                  heartbeat_at = EXCLUDED.heartbeat_at,
                  updated_at = EXCLUDED.updated_at
                """,
                storeId,
                companyId,
                cloudOnline,
                urlsJson,
                Timestamp.from(now),
                Timestamp.from(now)
            );
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("ok", true);
        out.put("upserted", upserted);
        out.put("cloudOnline", cloudOnline);
        return out;
    }

    @Override
    public Map<String, Object> statusForStore(Integer storeId) {
        if (storeId == null) {
            throw new BusinessException("storeId required");
        }
        Integer companyId = RestaurantTenantContext.getCompanyId();
        List<Map<String, Object>> rows = companyId == null
            ? jdbc.queryForList("""
                SELECT store_id, company_id, cloud_online, lan_hub_urls_json, heartbeat_at
                FROM rst_hall_presence WHERE store_id = ?
                """, storeId)
            : jdbc.queryForList("""
                SELECT store_id, company_id, cloud_online, lan_hub_urls_json, heartbeat_at
                FROM rst_hall_presence WHERE store_id = ? AND company_id = ?
                """, storeId, companyId);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("storeId", storeId);
        if (rows.isEmpty()) {
            out.put("known", false);
            out.put("cloudReachable", null);
            out.put("switchToLan", false);
            out.put("lanHubUrls", List.of());
            return out;
        }
        Map<String, Object> row = rows.get(0);
        boolean markedOnline = Boolean.TRUE.equals(row.get("cloud_online"));
        Instant beat = toInstant(row.get("heartbeat_at"));
        boolean fresh = beat != null && beat.isAfter(Instant.now().minus(STALE_AFTER));
        boolean cloudReachable = markedOnline && fresh;
        out.put("known", true);
        out.put("cloudReachable", cloudReachable);
        out.put("switchToLan", !cloudReachable);
        out.put("lanHubUrls", parseUrls(row.get("lan_hub_urls_json")));
        out.put("heartbeatAt", beat != null ? beat.toString() : null);
        return out;
    }

    private String toUrlsJson(List<String> urls) {
        try {
            List<String> clean = new ArrayList<>();
            if (urls != null) {
                for (String u : urls) {
                    if (u == null) continue;
                    String t = u.trim();
                    if (!t.isEmpty()) clean.add(t);
                }
            }
            return objectMapper.writeValueAsString(clean);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> parseUrls(Object raw) {
        if (raw == null) return List.of();
        try {
            return objectMapper.readValue(String.valueOf(raw), new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private static Instant toInstant(Object raw) {
        if (raw instanceof Timestamp ts) return ts.toInstant();
        if (raw instanceof Instant i) return i;
        return null;
    }
}
