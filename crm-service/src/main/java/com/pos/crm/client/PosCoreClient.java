package com.pos.crm.client;

import com.pos.crm.client.dto.CustomerSyncRequest;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PosCoreClient {

    private static final String POS_CORE = "pos-core";

    private final RestClient posCoreRestClient;
    private final CircuitBreakerRegistry circuitBreakerRegistry;

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
