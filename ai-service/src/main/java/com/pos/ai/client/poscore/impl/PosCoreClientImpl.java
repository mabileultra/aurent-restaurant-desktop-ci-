package com.pos.ai.client.poscore.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.pos.ai.client.poscore.PosCoreClient;
import com.pos.ai.support.HttpRequestAuthSupport;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class PosCoreClientImpl implements PosCoreClient {

    private static final String POS_CORE_SERVICE = "pos-core-service";

    private final RestClient posCoreRestClient;
    private final HttpRequestAuthSupport httpRequestAuthSupport;

    public PosCoreClientImpl(
        @Qualifier("posCoreRestClient") RestClient posCoreRestClient,
        HttpRequestAuthSupport httpRequestAuthSupport
    ) {
        this.posCoreRestClient = posCoreRestClient;
        this.httpRequestAuthSupport = httpRequestAuthSupport;
    }

    @Override
    @CircuitBreaker(name = POS_CORE_SERVICE, fallbackMethod = "resolveProductIdFallback")
    @Retry(name = POS_CORE_SERVICE)
    public Map<String, Object> resolveProductId(String query) {
        try {
            UUID.fromString(query);
            return Map.of("productId", query);
        } catch (Exception ignored) {
        }

        String uri = UriComponentsBuilder.fromPath("/products")
            .queryParam("search", query)
            .queryParam("size", 5)
            .build()
            .toUriString();

        try {
            RestClient.RequestHeadersSpec<?> spec = posCoreRestClient.get().uri(uri);
            httpRequestAuthSupport.authorizationHeader()
                .ifPresent(value -> spec.header(HttpHeaders.AUTHORIZATION, value));

            JsonNode response = spec.retrieve().body(new ParameterizedTypeReference<JsonNode>() {});
            if (response != null && response.has("content") && response.get("content").isArray()) {
                JsonNode content = response.get("content");
                if (content.size() > 0) {
                    JsonNode firstProduct = content.get(0);
                    if (firstProduct.has("id")) {
                        String productId = firstProduct.get("id").asText();
                        return Map.of("productId", productId);
                    }
                }
            }
            return Map.of();
        } catch (Exception e) {
            LogUtil.warn(PosCoreClientImpl.class, "Failed to resolve product ID for query={}: {}", query, e.getMessage());
            return Map.of();
        }
    }

    @Override
    @CircuitBreaker(name = POS_CORE_SERVICE, fallbackMethod = "getProductLifecycleFallback")
    @Retry(name = POS_CORE_SERVICE)
    public Map<String, Object> getProductLifecycle(UUID productId, LocalDate from, LocalDate to) {
        String uri = UriComponentsBuilder.fromPath("/products/{id}/lifecycle")
            .queryParam("from", from != null ? from.toString() : "")
            .queryParam("to", to != null ? to.toString() : "")
            .buildAndExpand(productId)
            .toUriString();

        try {
            RestClient.RequestHeadersSpec<?> spec = posCoreRestClient.get().uri(uri);
            httpRequestAuthSupport.authorizationHeader()
                .ifPresent(value -> spec.header(HttpHeaders.AUTHORIZATION, value));

            Map<String, Object> response = spec.retrieve().body(new ParameterizedTypeReference<>() {});
            if (response == null) {
                return Map.of("error", "Пустой ответ от сервиса продуктов");
            }
            return response;
        } catch (Exception e) {
            LogUtil.warn(PosCoreClientImpl.class, "Failed to get product lifecycle for id={}: {}", productId, e.getMessage());
            return Map.of("error", "Не удалось получить данные о жизненном цикле товара: " + e.getMessage());
        }
    }

    private Map<String, Object> resolveProductIdFallback(String query, Exception e) {
        LogUtil.warn(PosCoreClientImpl.class, "POS Core service unavailable for product search query={}", query);
        return Map.of();
    }

    private Map<String, Object> getProductLifecycleFallback(UUID productId, LocalDate from, LocalDate to, Exception e) {
        LogUtil.warn(PosCoreClientImpl.class, "POS Core service unavailable for product lifecycle id={}", productId);
        return Map.of("error", "Сервис продуктов временно недоступен");
    }
}
