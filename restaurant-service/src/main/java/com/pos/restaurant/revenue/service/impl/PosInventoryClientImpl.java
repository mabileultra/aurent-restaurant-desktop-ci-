package com.pos.restaurant.revenue.service.impl;

import com.pos.restaurant.recipe.dto.IngredientConsumeRequest;
import com.pos.restaurant.revenue.config.PosCoreProperties;
import com.pos.restaurant.revenue.service.PosInventoryClient;
import com.pos.shared.http.InternalApiHeaders;
import com.pos.shared.log.LogUtil;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class PosInventoryClientImpl implements PosInventoryClient {

    private final PosCoreProperties properties;
    private final RestClient restClient;

    public PosInventoryClientImpl(PosCoreProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
            .baseUrl(properties.getBaseUrl())
            .build();
    }

    @Override
    public boolean consumeIngredients(IngredientConsumeRequest request) {
        if (!properties.isEnabled() || request == null || request.lines() == null || request.lines().isEmpty()) {
            return true;
        }
        try {
            restClient.post()
                .uri("/internal/restaurant/stock-consume")
                .header(InternalApiHeaders.API_KEY, properties.getInternalApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toBodilessEntity();
            return true;
        } catch (Exception ex) {
            LogUtil.warn(PosInventoryClientImpl.class, "POS stock consume failed: {}", ex.getMessage());
            return false;
        }
    }

    @Override
    public boolean restoreIngredients(IngredientConsumeRequest request) {
        if (!properties.isEnabled() || request == null || request.lines() == null || request.lines().isEmpty()) {
            return true;
        }
        try {
            restClient.post()
                .uri("/internal/restaurant/stock-restore")
                .header(InternalApiHeaders.API_KEY, properties.getInternalApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toBodilessEntity();
            return true;
        } catch (Exception ex) {
            LogUtil.warn(PosInventoryClientImpl.class, "POS stock restore failed: {}", ex.getMessage());
            return false;
        }
    }
}
