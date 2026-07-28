package com.pos.identity.client;

import com.pos.identity.client.dto.AuditRequest;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.client.dto.StoreValidateRequest;
import com.pos.identity.client.dto.StoreValidateResponse;
import com.pos.identity.client.dto.SuperAdminLoginEmailRequest;
import com.pos.identity.client.dto.UserCredentialsEmailRequest;
import com.pos.identity.client.dto.UserSyncRequest;
import com.pos.identity.exception.BadRequestException;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PosCoreClient {

    private static final String POS_CORE = "pos-core";

    private final RestClient posCoreRestClient;
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public CompanyDto getCompanyByLoginCode(String loginCode) {
        return posCoreRestClient.get()
            .uri("/internal/identity/companies/by-login-code/{code}", loginCode)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                throw new BadRequestException("Invalid company code");
            })
            .body(CompanyDto.class);
    }

    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public CompanyDto getCompanyById(Integer id) {
        return posCoreRestClient.get()
            .uri("/internal/identity/companies/{id}", id)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                throw new BadRequestException("Company not found");
            })
            .body(CompanyDto.class);
    }

    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public StoreValidateResponse validateStores(StoreValidateRequest request) {
        return posCoreRestClient.post()
            .uri("/internal/identity/stores/validate")
            .body(request)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                throw new BadRequestException("Store validation failed");
            })
            .body(StoreValidateResponse.class);
    }

    public void syncUser(UserSyncRequest request) {
        postVoid("/internal/identity/users/sync", request);
    }

    public void audit(AuditRequest request) {
        postVoid("/internal/identity/audit", request);
    }

    public void notifySuperAdminLogin(SuperAdminLoginEmailRequest request) {
        postVoid("/internal/identity/email/super-admin-login", request);
    }

    public void sendUserCredentials(UserCredentialsEmailRequest request) {
        postVoid("/internal/identity/email/user-credentials", request);
    }

    /**
     * Fire-and-forget calls are not retried (avoids duplicate audit/sync/email side effects on
     * a POS core that actually processed the request but timed out on the response), but they
     * still go through the shared circuit breaker so a down POS core is failed fast instead of
     * blocking on the full read timeout for every login/user-write.
     */
    private void postVoid(String path, Object body) {
        try {
            circuitBreakerRegistry.circuitBreaker(POS_CORE).executeRunnable(() ->
                posCoreRestClient.post()
                    .uri(path)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity()
            );
        } catch (Exception ex) {
            LogUtil.warn(PosCoreClient.class, "POS core call failed: path={}, error={}", path, ex.getMessage());
        }
    }
}
