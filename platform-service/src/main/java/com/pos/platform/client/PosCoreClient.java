package com.pos.platform.client;

import com.pos.platform.client.dto.CompanyStoreCountResponse;
import com.pos.platform.client.dto.CompanySyncRequest;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PosCoreClient {

    private static final String POS_CORE = "pos-core";

    private final RestClient posCoreRestClient;
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    /**
     * Not retried — the sync call is fire-and-forget already, and retrying blindly risks a
     * duplicate sync if POS core actually applied it before the response timed out. Still routed
     * through the shared circuit breaker so a down POS core fails fast instead of blocking.
     */
    public void syncCompany(CompanySyncRequest request) {
        try {
            circuitBreakerRegistry.circuitBreaker(POS_CORE).executeRunnable(() ->
                posCoreRestClient.post()
                    .uri("/internal/platform/companies/sync")
                    .body(request)
                    .retrieve()
                    .toBodilessEntity()
            );
        } catch (Exception ex) {
            LogUtil.warn(PosCoreClient.class, "Company sync to POS core failed: id={}, op={}", request.id(), request.operation());
        }
    }

    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public int getStoreCount(Integer companyId) {
        CompanyStoreCountResponse response = posCoreRestClient.get()
            .uri("/internal/platform/companies/{id}/store-count", companyId)
            .retrieve()
            .body(CompanyStoreCountResponse.class);
        return response != null ? response.storeCount() : 0;
    }
}
