package com.pos.integrations.restaurant.support;

import com.pos.client.restaurant.RestaurantStoreMirrorClient;
import com.pos.entity.Store;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Pushes restaurant/canteen branches to restaurant-service {@code edge_stores}
 * so StoreTenantSupport does not depend on desktop bootstrap.
 */
@Component
@RequiredArgsConstructor
public class RestaurantStoreMirrorNotifier {

    private final RestaurantStoreMirrorClient client;

    public void afterSave(Store store) {
        if (store == null || store.getId() == null || store.getCompany() == null) {
            return;
        }
        String type = normalizeType(store.getBusinessType());
        if (!isRestaurantFloor(type)) {
            client.deactivate(store.getId());
            return;
        }
        client.upsert(
            store.getId(),
            store.getCompany().getId(),
            store.getName(),
            store.getCode(),
            store.getAddress(),
            store.getPhone(),
            type,
            store.isActive()
        );
    }

    public void afterDelete(Integer storeId) {
        client.deactivate(storeId);
    }

    static boolean isRestaurantFloor(String businessType) {
        String type = normalizeType(businessType);
        return "RESTAURANT".equals(type) || "CANTEEN".equals(type) || "CAFE".equals(type);
    }

    private static String normalizeType(String businessType) {
        return StringUtils.hasText(businessType) ? businessType.trim().toUpperCase() : "";
    }
}
