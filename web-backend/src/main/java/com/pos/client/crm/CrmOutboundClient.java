package com.pos.client.crm;

import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CrmOutboundClient {

    private static final String CRM_SERVICE = "crm-service";

    private final RestClient crmRestClient;
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    /**
     * Fails "blocked" (true) when crm-service is unreachable — a delete/rename must not silently
     * proceed just because the dependency check couldn't be made.
     */
    public boolean existsOrderByCreator(UUID userId) {
        try {
            return Boolean.TRUE.equals(circuitBreakerRegistry.circuitBreaker(CRM_SERVICE).executeSupplier(() ->
                crmRestClient.get()
                    .uri("/internal/crm/orders/exists-by-creator/{userId}", userId)
                    .retrieve()
                    .body(Boolean.class)
            ));
        } catch (Exception ex) {
            LogUtil.warn(CrmOutboundClient.class, "Failed to check crm-service orders by creator, assuming blocked: userId=" + userId, ex);
            return true;
        }
    }

    public long countOrdersByStore(Integer storeId) {
        try {
            Long count = circuitBreakerRegistry.circuitBreaker(CRM_SERVICE).executeSupplier(() ->
                crmRestClient.get()
                    .uri("/internal/crm/orders/count-by-store/{storeId}", storeId)
                    .retrieve()
                    .body(Long.class)
            );
            return count != null ? count : 0L;
        } catch (Exception ex) {
            LogUtil.warn(CrmOutboundClient.class, "Failed to count crm-service orders by store, assuming blocked: storeId=" + storeId, ex);
            return 1L;
        }
    }
}
