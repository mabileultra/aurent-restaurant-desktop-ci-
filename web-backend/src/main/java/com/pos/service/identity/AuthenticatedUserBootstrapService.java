package com.pos.service.identity;

import com.pos.client.identity.IdentityOutboundClient;
import com.pos.dto.identity.internal.UserSyncRequest;
import com.pos.entity.User;
import com.pos.security.cache.AuthenticatedUserCache;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticatedUserBootstrapService {

    private final IdentityOutboundClient identityOutboundClient;
    private final IdentityUserSyncService identityUserSyncService;
    private final AuthenticatedUserCache authenticatedUserCache;

    public Optional<User> ensureUser(UUID userId) {
        UserSyncRequest payload = identityOutboundClient.fetchUserSyncPayload(userId);
        if (payload == null) {
            return Optional.empty();
        }
        try {
            identityUserSyncService.sync(payload);
            authenticatedUserCache.evict(userId);
            return authenticatedUserCache.findById(userId);
        } catch (Exception ex) {
            LogUtil.warn(AuthenticatedUserBootstrapService.class, "Failed to bootstrap user from identity: userId=" + userId, ex);
            return Optional.empty();
        }
    }
}
