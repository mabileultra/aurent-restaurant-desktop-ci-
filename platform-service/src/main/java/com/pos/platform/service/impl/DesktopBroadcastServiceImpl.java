package com.pos.platform.service.impl;

import com.pos.platform.dto.desktop.DesktopBroadcastCreateRequest;
import com.pos.platform.dto.desktop.DesktopBroadcastListResponse;
import com.pos.platform.dto.desktop.DesktopBroadcastResponse;
import com.pos.platform.dto.desktop.DesktopBroadcastUpdateRequest;
import com.pos.platform.entity.DesktopBroadcast;
import com.pos.platform.entity.DesktopBroadcastRead;
import com.pos.platform.entity.DesktopBroadcastReadId;
import com.pos.platform.entity.DesktopBroadcastStatus;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.mapper.DesktopBroadcastMapper;
import com.pos.platform.repository.DesktopBroadcastReadRepository;
import com.pos.platform.repository.DesktopBroadcastRepository;
import com.pos.platform.security.PlatformTenantContext;
import com.pos.platform.service.DesktopBroadcastService;
import com.pos.platform.service.support.DesktopBroadcastCreateSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DesktopBroadcastServiceImpl implements DesktopBroadcastService {

    private final DesktopBroadcastRepository broadcastRepository;
    private final DesktopBroadcastReadRepository readRepository;
    private final DesktopBroadcastMapper mapper;
    private final DesktopBroadcastCreateSupport createSupport;

    @Override
    public DesktopBroadcastResponse broadcast(DesktopBroadcastCreateRequest request) {
        UUID adminId = PlatformTenantContext.getUserId();
        if (adminId == null) {
            throw new BadRequestException("Access denied");
        }

        DesktopBroadcast broadcast = createSupport.build(request, adminId);
        DesktopBroadcast saved = broadcastRepository.save(broadcast);
        LogUtil.info(
            DesktopBroadcastServiceImpl.class,
            "Desktop broadcast created: id={}, kind={}, target={}, status={}, by={}",
            saved.getId(),
            saved.getKind(),
            saved.getTargetType(),
            saved.getStatus(),
            adminId
        );
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DesktopBroadcastListResponse listUnreadForUser(
        UUID userId,
        Integer companyId,
        Collection<Integer> storeIds
    ) {
        Collection<Integer> safeStoreIds = (storeIds == null || storeIds.isEmpty())
            ? List.of(-1)
            : storeIds;
        boolean hasStores = storeIds != null && !storeIds.isEmpty();

        List<DesktopBroadcastResponse> items = broadcastRepository
            .findUnreadForUser(userId, companyId, safeStoreIds, hasStores, Instant.now())
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
        broadcast.setStatus(DesktopBroadcastStatus.ACTIVE);
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

    @Override
    public int activateDueBroadcasts() {
        int activated = broadcastRepository.activateDueBroadcasts(Instant.now());
        if (activated > 0) {
            LogUtil.info(
                DesktopBroadcastServiceImpl.class,
                "Desktop scheduled broadcasts activated: count={}",
                activated
            );
        }
        return activated;
    }
}
