package com.pos.platform.client;

import com.pos.platform.client.dto.IdentityUserResponse;
import com.pos.platform.client.dto.ProvisionIdentityUserRequest;
import com.pos.shared.log.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
public class IdentityClient {

    private final RestClient identityRestClient;

    public IdentityClient(@Qualifier("identityRestClient") RestClient identityRestClient) {
        this.identityRestClient = identityRestClient;
    }

    public IdentityUserResponse provisionAdmin(ProvisionIdentityUserRequest request) {
        return identityRestClient.post()
            .uri("/internal/pos/users")
            .body(request)
            .retrieve()
            .body(IdentityUserResponse.class);
    }

    public void deleteUser(UUID userId) {
        if (userId == null) {
            return;
        }
        try {
            identityRestClient.delete()
                .uri("/internal/pos/users/{id}", userId)
                .retrieve()
                .toBodilessEntity();
        } catch (Exception ex) {
            LogUtil.warn(IdentityClient.class, "User compensate delete failed: id={}", userId);
        }
    }
}
