package com.pos.service.desktop.impl;

import com.pos.dto.desktop.DesktopBroadcastCreateRequest;
import com.pos.dto.desktop.DesktopBroadcastListResponse;
import com.pos.dto.desktop.DesktopBroadcastResponse;
import com.pos.entity.DesktopBroadcast;
import com.pos.entity.DesktopBroadcastRead;
import com.pos.entity.DesktopBroadcastReadId;
import com.pos.entity.User;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.DesktopBroadcastMapper;
import com.pos.repository.DesktopBroadcastReadRepository;
import com.pos.repository.DesktopBroadcastRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.service.desktop.DesktopBroadcastService;
import com.pos.util.LogUtil;
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
    private final CurrentUserProvider currentUserProvider;

    @Override
    public DesktopBroadcastResponse broadcast(DesktopBroadcastCreateRequest request) {
        User admin = currentUserProvider.requireCurrentUser();
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
            .createdBy(admin)
            .expiresAt(expiresAt)
            .build();

        DesktopBroadcast saved = broadcastRepository.save(broadcast);
        LogUtil.info(
            DesktopBroadcastServiceImpl.class,
            "Desktop broadcast created: id={}, kind={}, by={}",
            saved.getId(),
            saved.getKind(),
            admin.getId()
        );
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DesktopBroadcastListResponse listUnreadForCurrentUser() {
        User user = currentUserProvider.requireCurrentUser();
        List<DesktopBroadcastResponse> items = broadcastRepository
            .findUnreadForUser(user.getId(), Instant.now())
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
    public void markRead(UUID broadcastId) {
        User user = currentUserProvider.requireCurrentUser();
        DesktopBroadcast broadcast = broadcastRepository.findById(broadcastId)
            .orElseThrow(() -> new ResourceNotFoundException("Broadcast not found"));

        DesktopBroadcastReadId id = new DesktopBroadcastReadId(broadcastId, user.getId());
        if (readRepository.existsById(id)) {
            return;
        }

        DesktopBroadcastRead read = DesktopBroadcastRead.builder()
            .id(id)
            .broadcast(broadcast)
            .user(user)
            .build();
        readRepository.save(read);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
