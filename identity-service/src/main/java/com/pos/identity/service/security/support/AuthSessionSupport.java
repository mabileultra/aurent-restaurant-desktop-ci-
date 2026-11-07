package com.pos.identity.service.security.support;

import com.pos.identity.dto.security.AuthSessionResponse;
import com.pos.identity.entity.AuthSession;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.exception.ResourceNotFoundException;
import com.pos.identity.repository.AuthSessionRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.IdentityTenantContext;
import com.pos.identity.security.RoleName;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AuthSessionSupport {

    private static final DateTimeFormatter WHEN_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")
        .withZone(ZoneId.of("Asia/Tashkent"));

    private final AuthSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final UserAgentDeviceParser deviceParser;

    @Transactional
    public AuthSession open(User user, String clientIp, String userAgent) {
        UserAgentDeviceParser.DeviceInfo device = deviceParser.parse(userAgent);
        AuthSession session = AuthSession.builder()
            .userId(user.getId())
            .deviceLabel(device.label())
            .deviceType(device.type())
            .userAgent(trim(userAgent, 512))
            .ipAddress(trim(clientIp, 64))
            .locationLabel(null)
            .build();
        return sessionRepository.save(session);
    }

    @Transactional
    public void enforceConcurrentLimit(UUID userId, UUID keepSessionId, int maxConcurrent) {
        if (maxConcurrent <= 0) {
            return;
        }
        List<AuthSession> active = sessionRepository.findByUserIdAndRevokedAtIsNullOrderByLastSeenAtDesc(userId);
        if (active.size() <= maxConcurrent) {
            return;
        }
        Instant now = Instant.now();
        int othersAllowed = Math.max(0, maxConcurrent - 1);
        int othersKept = 0;
        for (AuthSession session : active) {
            if (session.getId().equals(keepSessionId)) {
                continue;
            }
            if (othersKept < othersAllowed) {
                othersKept++;
                continue;
            }
            session.setRevokedAt(now);
            sessionRepository.save(session);
        }
    }

    @Transactional(readOnly = true)
    public boolean isActive(UUID sessionId) {
        if (sessionId == null) {
            return true; // legacy tokens without sid
        }
        return sessionRepository.findByIdAndRevokedAtIsNull(sessionId).isPresent();
    }

    @Transactional
    public void touch(UUID sessionId) {
        if (sessionId == null) {
            return;
        }
        sessionRepository.touch(sessionId, Instant.now());
    }

    @Transactional(readOnly = true)
    public boolean isExpiredByMaxHours(UUID sessionId, int maxHours) {
        if (sessionId == null || maxHours <= 0) {
            return false;
        }
        return sessionRepository.findById(sessionId)
            .map(s -> s.getCreatedAt().plus(Duration.ofHours(maxHours)).isBefore(Instant.now()))
            .orElse(true);
    }

    @Transactional(readOnly = true)
    public List<AuthSessionResponse> listPlatformSessions(UUID currentSessionId) {
        List<UUID> userIds = userRepository.findPlatformSecurityUsers().stream()
            .map(User::getId)
            .collect(Collectors.toList());
        UUID me = IdentityTenantContext.userId();
        if (me != null && !userIds.contains(me)) {
            userIds.add(me);
        }
        if (userIds.isEmpty()) {
            return List.of();
        }
        Map<UUID, User> users = userRepository.findAllById(userIds).stream()
            .collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a));
        return sessionRepository.findByUserIdInAndRevokedAtIsNullOrderByLastSeenAtDesc(userIds).stream()
            .map(session -> toResponse(session, users.get(session.getUserId()), currentSessionId))
            .toList();
    }

    @Transactional
    public void revoke(UUID sessionId, UUID actorUserId) {
        AuthSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        if (session.getRevokedAt() != null) {
            return;
        }
        if (!session.getUserId().equals(actorUserId) && !isPlatformStaffActor()) {
            throw new BadRequestException("Cannot revoke another user's session");
        }
        session.setRevokedAt(Instant.now());
        sessionRepository.save(session);
    }

    @Transactional
    public int revokeOthers(UUID userId, UUID keepSessionId) {
        return sessionRepository.revokeOthers(userId, keepSessionId, Instant.now());
    }

    private AuthSessionResponse toResponse(AuthSession session, User user, UUID currentSessionId) {
        String who = user != null
            ? (StringUtils.hasText(user.getFullName()) ? user.getFullName() : user.getUsername())
            : "User";
        String where = StringUtils.hasText(session.getIpAddress())
            ? session.getIpAddress() + (StringUtils.hasText(session.getLocationLabel())
            ? " · " + session.getLocationLabel() : "")
            : "—";
        String when = "Oxirgi faollik: " + WHEN_FMT.format(session.getLastSeenAt());
        return new AuthSessionResponse(
            session.getId(),
            session.getUserId(),
            who,
            session.getDeviceLabel(),
            session.getDeviceType(),
            where,
            when,
            currentSessionId != null && currentSessionId.equals(session.getId()),
            session.getLastSeenAt(),
            session.getCreatedAt()
        );
    }

    private boolean isPlatformStaffActor() {
        String role = IdentityTenantContext.role();
        return RoleName.SUPER_ADMIN.name().equals(role)
            || RoleName.PLATFORM_ADMIN.name().equals(role);
    }

    private static String trim(String value, int max) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max);
    }
}
