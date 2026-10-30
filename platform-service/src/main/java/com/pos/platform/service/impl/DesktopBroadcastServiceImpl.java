package com.pos.platform.service.impl;

import com.pos.platform.dto.desktop.DesktopBroadcastCreateRequest;
import com.pos.platform.dto.desktop.DesktopBroadcastListResponse;
import com.pos.platform.dto.desktop.DesktopBroadcastResponse;
import com.pos.platform.dto.desktop.DesktopBroadcastUpdateRequest;
import com.pos.platform.entity.DesktopBroadcast;
import com.pos.platform.entity.DesktopBroadcastRead;
import com.pos.platform.entity.DesktopBroadcastReadId;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.mapper.DesktopBroadcastMapper;
import com.pos.platform.repository.DesktopBroadcastReadRepository;
import com.pos.platform.repository.DesktopBroadcastRepository;
import com.pos.platform.security.PlatformTenantContext;
import com.pos.platform.service.DesktopBroadcastService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DesktopBroadcastServiceImpl implements DesktopBroadcastService {

    private final DesktopBroadcastRepository broadcastRepository;
    private final DesktopBroadcastReadRepository readRepository;
    private final DesktopBroadcastMapper mapper;

    @Override
    public DesktopBroadcastResponse broadcast(DesktopBroadcastCreateRequest request) {
        UUID adminId = PlatformTenantContext.getUserId();
        if (adminId == null) {
            throw new BadRequestException("Access denied");
        }

        Instant expiresAt = null;
        if (request.expiresInHours() != null && request.expiresInHours() > 0) {
            expiresAt = Instant.now().plus(request.expiresInHours(), ChronoUnit.HOURS);
        }

        DesktopBroadcast broadcast = DesktopBroadcast.builder()
            .title(request.title().trim())
            .body(request.body().trim())
            .kind(request.kind())
            .priority(request.priority() != null ? request.priority() : 0)
            .actionLabel(trimToNull(request.actionLabel()))
            .actionUrl(trimToNull(request.actionUrl()))
            .createdBy(adminId)
            .expiresAt(expiresAt)
            .build();

        DesktopBroadcast saved = broadcastRepository.save(broadcast);
        LogUtil.info(
            DesktopBroadcastServiceImpl.class,
            "Desktop broadcast created: id={}, kind={}, by={}",
            saved.getId(),
            saved.getKind(),
            adminId
        );
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DesktopBroadcastListResponse listUnreadForUser(UUID userId) {
        List<DesktopBroadcastResponse> items = broadcastRepository
            .findUnreadForUser(userId, Instant.now())
            .stream()
            .map(mapper::toResponse)
            .toList();
        return new DesktopBroadcastListResponse(items, items.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DesktopBroadcastResponse> listRecentForPlatform() {
        return broadcastRepository.findTop50ByOrderByCreatedAtDesc().stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Override
    public void markRead(UUID broadcastId, UUID userId) {
        if (!broadcastRepository.existsById(broadcastId)) {
            throw new ResourceNotFoundException("Broadcast not found");
        }

        DesktopBroadcastReadId id = new DesktopBroadcastReadId(broadcastId, userId);
        if (readRepository.existsById(id)) {
            return;
        }

        DesktopBroadcastRead read = DesktopBroadcastRead.builder()
            .id(id)
            .build();
        readRepository.save(read);
    }

    @Override
    public void revoke(UUID broadcastId) {
        DesktopBroadcast broadcast = broadcastRepository.findById(broadcastId)
            .orElseThrow(() -> new ResourceNotFoundException("Broadcast not found"));
        broadcast.setExpiresAt(Instant.now());
        broadcastRepository.save(broadcast);
        LogUtil.info(DesktopBroadcastServiceImpl.class, "Desktop broadcast revoked: id={}", broadcastId);
    }

    @Override
    public DesktopBroadcastResponse extend(UUID broadcastId, DesktopBroadcastUpdateRequest request) {
        if (request == null || (request.expiresAt() == null && request.expiresInHours() == null)) {
            throw new BadRequestException("expiresAt or expiresInHours required");
        }
        DesktopBroadcast broadcast = broadcastRepository.findById(broadcastId)
            .orElseThrow(() -> new ResourceNotFoundException("Broadcast not found"));
        Instant nextExpiry = request.expiresAt() != null
            ? request.expiresAt()
            : Instant.now().plus(request.expiresInHours(), ChronoUnit.HOURS);
        if (!nextExpiry.isAfter(Instant.now())) {
            throw new BadRequestException("New expiry must be in the future");
        }
        broadcast.setExpiresAt(nextExpiry);
        DesktopBroadcast saved = broadcastRepository.save(broadcast);
        LogUtil.info(
            DesktopBroadcastServiceImpl.class,
            "Desktop broadcast extended: id={}, expiresAt={}",
            broadcastId,
            nextExpiry
        );
        return mapper.toResponse(saved);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
