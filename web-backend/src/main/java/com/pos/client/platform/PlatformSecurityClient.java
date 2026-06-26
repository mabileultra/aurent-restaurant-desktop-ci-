package com.pos.client.platform;

import com.pos.dto.platform.security.VerifyCashierServerPasswordRequest;
import com.pos.dto.platform.security.VerifyCashierServerPasswordResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PlatformSecurityClient {

    private final RestClient platformRestClient;

    public VerifyCashierServerPasswordResponse verifyCashierServerPassword(String password) {
        return platformRestClient.post()
            .uri("/internal/platform/security/verify-cashier-password")
            .body(new VerifyCashierServerPasswordRequest(password))
            .retrieve()
            .body(VerifyCashierServerPasswordResponse.class);
    }
}
