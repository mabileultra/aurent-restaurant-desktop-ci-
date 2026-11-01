package com.pos.platform.service.support;

import com.pos.platform.dto.desktop.DesktopBroadcastCreateRequest;
import com.pos.platform.entity.DesktopBroadcast;
import com.pos.platform.entity.DesktopBroadcastStatus;
import com.pos.platform.entity.DesktopBroadcastTargetType;
import com.pos.platform.exception.BadRequestException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class DesktopBroadcastCreateSupport {

    public DesktopBroadcast build(DesktopBroadcastCreateRequest request, UUID adminId) {
        DesktopBroadcastTargetType targetType = resolveTargetType(request.targetType());
        Set<Integer> companyIds = normalizeIds(request.companyIds());
        Set<Integer> storeIds = normalizeIds(request.storeIds());
        validateTarget(targetType, companyIds, storeIds);

        boolean scheduled = isScheduled(request.scheduleType());
        Instant scheduledAt = null;
        DesktopBroadcastStatus status = DesktopBroadcastStatus.ACTIVE;
        if (scheduled) {
            if (request.scheduledAt() == null) {
                throw new BadRequestException("scheduledAt required for SCHEDULED broadcasts");
            }
            if (!request.scheduledAt().isAfter(Instant.now())) {
                throw new BadRequestException("scheduledAt must be in the future");
            }
            scheduledAt = request.scheduledAt();
            status = DesktopBroadcastStatus.SCHEDULED;
        }

        Instant baseTime = scheduledAt != null ? scheduledAt : Instant.now();
        Instant expiresAt = null;
        if (request.expiresInHours() != null && request.expiresInHours() > 0) {
            expiresAt = baseTime.plus(request.expiresInHours(), ChronoUnit.HOURS);
        }

        return DesktopBroadcast.builder()
            .title(request.title().trim())
            .body(request.body().trim())
            .kind(request.kind())
            .priority(request.priority() != null ? request.priority() : 0)
            .actionLabel(trimToNull(request.actionLabel()))
            .actionUrl(trimToNull(request.actionUrl()))
            .createdBy(adminId)
            .expiresAt(expiresAt)
            .targetType(targetType)
            .scheduledAt(scheduledAt)
            .status(status)
            .companyIds(targetType == DesktopBroadcastTargetType.COMPANIES ? companyIds : new HashSet<>())
            .storeIds(targetType == DesktopBroadcastTargetType.STORES ? storeIds : new HashSet<>())
            .build();
    }

    private static DesktopBroadcastTargetType resolveTargetType(String raw) {
        if (!StringUtils.hasText(raw)) {
            return DesktopBroadcastTargetType.ALL;
        }
        try {
            return DesktopBroadcastTargetType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("targetType must be ALL, COMPANIES or STORES");
        }
    }

    private static boolean isScheduled(String scheduleType) {
        if (!StringUtils.hasText(scheduleType)) {
            return false;
        }
        String normalized = scheduleType.trim().toUpperCase(Locale.ROOT);
        if ("NOW".equals(normalized)) {
            return false;
        }
        if ("SCHEDULED".equals(normalized)) {
            return true;
        }
        throw new BadRequestException("scheduleType must be NOW or SCHEDULED");
    }

    private static void validateTarget(
        DesktopBroadcastTargetType targetType,
        Set<Integer> companyIds,
        Set<Integer> storeIds
    ) {
        if (targetType == DesktopBroadcastTargetType.COMPANIES && companyIds.isEmpty()) {
            throw new BadRequestException("companyIds required when targetType=COMPANIES");
        }
        if (targetType == DesktopBroadcastTargetType.STORES && storeIds.isEmpty()) {
            throw new BadRequestException("storeIds required when targetType=STORES");
        }
    }

    private static Set<Integer> normalizeIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }
        return ids.stream()
            .filter(id -> id != null && id > 0)
            .collect(Collectors.toCollection(HashSet::new));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
