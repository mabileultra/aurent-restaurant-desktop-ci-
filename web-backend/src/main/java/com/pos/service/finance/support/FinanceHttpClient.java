package com.pos.service.finance.support;

import com.pos.config.finance.FinanceServiceProperties;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import com.pos.shared.http.InternalApiHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class FinanceHttpClient {

    private final RestTemplate financeRestTemplate;
    private final FinanceServiceProperties properties;

    public boolean postInternal(String path, Object payload) {
        if (!properties.isEnabled()) {
            return false;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(InternalApiHeaders.API_KEY, properties.getInternalApiKey());
        try {
            financeRestTemplate.postForEntity(
                properties.getBaseUrl() + path,
                new HttpEntity<>(payload, headers),
                Void.class
            );
            return true;
        } catch (RestClientException ex) {
            LogUtil.warn(FinanceHttpClient.class, "Finance internal call failed: path={}, error={}", path, ex.getMessage());
            return false;
        }
    }
}
