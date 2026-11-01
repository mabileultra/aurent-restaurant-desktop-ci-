package com.pos.client.restaurant;

import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

/** Best-effort mirror of restaurant/canteen stores into restaurant-service edge_stores. */
@Component
@RequiredArgsConstructor
public class RestaurantStoreMirrorClient {

    private final RestClient restaurantRestClient;

    public void upsert(
        Integer id,
        Integer companyId,
        String name,
        String code,
        String address,
        String phone,
        String businessType,
        boolean active
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", id);
        body.put("companyId", companyId);
        body.put("name", name);
        body.put("code", code);
        body.put("address", address);
        body.put("phone", phone);
        body.put("businessType", businessType);
        body.put("active", active);
        try {
            restaurantRestClient.put()
                .uri("/internal/rst/stores")
                .body(body)
                .retrieve()
                .toBodilessEntity();
        } catch (Exception ex) {
            LogUtil.warn(RestaurantStoreMirrorClient.class,
                "Failed to mirror store to restaurant-service: id=" + id, ex);
        }
    }

    public void deactivate(Integer storeId) {
        if (storeId == null) {
            return;
        }
        try {
            restaurantRestClient.delete()
                .uri("/internal/rst/stores/{storeId}", storeId)
                .retrieve()
                .toBodilessEntity();
        } catch (Exception ex) {
            LogUtil.warn(RestaurantStoreMirrorClient.class,
                "Failed to deactivate mirrored store: id=" + storeId, ex);
        }
    }
}
