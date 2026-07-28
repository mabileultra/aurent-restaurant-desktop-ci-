package com.pos.integrations.finance.service.support;

import com.pos.integrations.finance.config.FinanceServiceProperties;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.RequiredArgsConstructor;
import com.pos.shared.http.InternalApiHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class FinanceHttpClient {

    private static final String FINANCE_SERVICE = "finance-service";

    private final RestTemplate financeRestTemplate;
    private final FinanceServiceProperties properties;
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    public boolean postInternal(String path, Object payload) {
        if (!properties.isEnabled()) {
            return false;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(InternalApiHeaders.API_KEY, properties.getInternalApiKey());
        try {
            circuitBreakerRegistry.circuitBreaker(FINANCE_SERVICE).executeRunnable(() ->
                financeRestTemplate.postForEntity(
                    properties.getBaseUrl() + path,
                    new HttpEntity<>(payload, headers),
                    Void.class
                )
            );
            return true;
        } catch (Exception ex) {
            LogUtil.warn(FinanceHttpClient.class, "Finance internal call failed: path={}, error={}", path, ex.getMessage());
            return false;
        }
    }
}
