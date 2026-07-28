package com.pos.client.identity;

import com.pos.dto.identity.internal.UserSyncRequest;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class IdentityOutboundClient {

    private static final String IDENTITY_SERVICE = "identity-service";

    private final RestClient identityRestClient;
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    public UserSyncRequest fetchUserSyncPayload(UUID userId) {
        try {
            return circuitBreakerRegistry.circuitBreaker(IDENTITY_SERVICE).executeSupplier(() ->
                identityRestClient.get()
                    .uri("/internal/pos/users/{id}/sync-payload", userId)
                    .retrieve()
                    .body(UserSyncRequest.class)
            );
        } catch (Exception ex) {
            LogUtil.warn(IdentityOutboundClient.class, "Failed to fetch identity sync payload: userId=" + userId, ex);
            return null;
        }
    }
}
