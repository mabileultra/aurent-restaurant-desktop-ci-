package com.pos.platform.client;

import com.pos.platform.client.dto.CashRegisterStatsResponse;
import com.pos.platform.client.dto.CompanyStoreCountMap;
import com.pos.platform.client.dto.CompanyStoreCountResponse;
import com.pos.platform.client.dto.CompanyStoreCountsResponse;
import com.pos.platform.client.dto.CompanySyncRequest;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    public int getStoreCountOrZero(Integer companyId) {
        if (companyId == null) {
            return 0;
        }
        return getStoreCountsOrEmpty(List.of(companyId)).getOrDefault(companyId, 0);
    }

    /** One call for the companies table. Empty map if POS core is down — the list still renders. */
    public Map<Integer, Integer> getStoreCountsOrEmpty(Collection<Integer> companyIds) {
        if (companyIds == null || companyIds.isEmpty()) {
            return Map.of();
        }
        var breaker = circuitBreakerRegistry.circuitBreaker(POS_CORE);
        if (breaker.getState() == io.github.resilience4j.circuitbreaker.CircuitBreaker.State.OPEN
            || breaker.getState() == io.github.resilience4j.circuitbreaker.CircuitBreaker.State.FORCED_OPEN) {
            return Map.of();
        }
        try {
            return breaker.executeSupplier(() -> fetchStoreCounts(companyIds));
        } catch (RuntimeException ex) {
            LogUtil.warn(
                PosCoreClient.class,
                "Store counts unavailable, companies still listed: reason={}",
                ex.getMessage()
            );
            return Map.of();
        }
    }

    private Map<Integer, Integer> fetchStoreCounts(Collection<Integer> companyIds) {
        String ids = companyIds.stream()
            .filter(id -> id != null)
            .distinct()
            .map(String::valueOf)
            .collect(Collectors.joining(","));
        if (ids.isBlank()) {
            return Map.of();
        }
        CompanyStoreCountsResponse response = posCoreRestClient.get()
            .uri("/internal/platform/companies/store-counts?ids={ids}", ids)
            .retrieve()
            .body(CompanyStoreCountsResponse.class);
        if (response == null) {
            return Map.of();
        }
        return CompanyStoreCountMap.fromItems(response.items());
    }

    @CircuitBreaker(name = POS_CORE)
    @Retry(name = POS_CORE)
    public CashRegisterStatsResponse getCashRegisterStats() {
        CashRegisterStatsResponse response = posCoreRestClient.get()
            .uri("/internal/platform/cash-registers/stats")
            .retrieve()
            .body(CashRegisterStatsResponse.class);
        return response != null
            ? response
            : new CashRegisterStatsResponse(0, 0, 0, 0);
    }

    public CashRegisterStatsResponse getCashRegisterStatsOrZero() {
        try {
            return getCashRegisterStats();
        } catch (RuntimeException ex) {
            LogUtil.warn(PosCoreClient.class, "Cash register stats unavailable: reason={}", ex.getMessage());
            return new CashRegisterStatsResponse(0, 0, 0, 0);
        }
    }
}
