package com.pos.client.identity;

import com.pos.dto.identity.internal.UserSyncRequest;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class IdentityOutboundClient {

    private final RestClient identityRestClient;

    public UserSyncRequest fetchUserSyncPayload(UUID userId) {
        try {
            return identityRestClient.get()
                .uri("/internal/pos/users/{id}/sync-payload", userId)
                .retrieve()
                .body(UserSyncRequest.class);
        } catch (Exception ex) {
            LogUtil.warn(IdentityOutboundClient.class, "Failed to fetch identity sync payload: userId=" + userId, ex);
            return null;
        }
    }
}
