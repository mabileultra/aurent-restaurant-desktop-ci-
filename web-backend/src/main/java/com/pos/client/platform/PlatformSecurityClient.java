package com.pos.client.platform;

import com.pos.dto.platform.security.VerifyCashierServerPasswordRequest;
import com.pos.dto.platform.security.VerifyCashierServerPasswordResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PlatformSecurityClient {

    private static final String PLATFORM_SERVICE = "platform-service";

    private final RestClient platformRestClient;

    @CircuitBreaker(name = PLATFORM_SERVICE)
    @Retry(name = PLATFORM_SERVICE)
    public VerifyCashierServerPasswordResponse verifyCashierServerPassword(String password) {
        return platformRestClient.post()
            .uri("/internal/platform/security/verify-cashier-password")
            .body(new VerifyCashierServerPasswordRequest(password))
            .retrieve()
            .body(VerifyCashierServerPasswordResponse.class);
    }
}
