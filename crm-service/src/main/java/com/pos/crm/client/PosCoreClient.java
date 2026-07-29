package com.pos.crm.client;

import com.pos.crm.client.dto.CourierRefDto;
import com.pos.crm.client.dto.CustomerSyncRequest;
import com.pos.crm.client.dto.StoreRefDto;
import com.pos.crm.exception.BadRequestException;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PosCoreClient {

    private static final String POS_CORE = "pos-core";

    private final RestClient posCoreRestClient;
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public StoreRefDto getStore(Integer id) {
        return posCoreRestClient.get()
            .uri("/internal/crm/stores/{id}", id)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                throw new BadRequestException("Store not found: " + id);
            })
            .body(StoreRefDto.class);
    }

    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public List<CourierRefDto> listCouriers(Integer companyId) {
        return posCoreRestClient.get()
            .uri("/internal/crm/couriers?companyId={companyId}", companyId)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                throw new BadRequestException("Failed to load couriers");
            })
            .body(new ParameterizedTypeReference<List<CourierRefDto>>() {});
    }

    public void syncCustomer(CustomerSyncRequest request) {
        postVoid("/internal/crm/customers/sync", request);
    }

    /**
     * Fire-and-forget: web-backend's local Customer replica is a read-side convenience for its
     * own joins (Sale.customer, finance payloads) — a failed sync push must not break the actual
     * customer create/update in crm-service. Not retried, to avoid duplicate side effects on a
     * POS core that actually processed the request but timed out on the response; still goes
     * through the shared circuit breaker so a down POS core fails fast instead of blocking.
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
