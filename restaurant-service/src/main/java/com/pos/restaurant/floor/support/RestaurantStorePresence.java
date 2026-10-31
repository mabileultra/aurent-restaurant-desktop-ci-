package com.pos.restaurant.floor.support;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Cloud restaurant-service has no master {@code stores} table — only edge PCs fill
 * {@code edge_stores}. Presence of hall/menu/settings for company+store proves the branch.
 */
@Component
@RequiredArgsConstructor
public class RestaurantStorePresence {

    private final JdbcTemplate jdbc;

    public boolean existsForCompany(Integer companyId, Integer storeId) {
        if (companyId == null || storeId == null) {
            return false;
        }
        Integer hit = jdbc.queryForObject(
            """
            SELECT CASE
              WHEN EXISTS (
                SELECT 1 FROM floor_halls WHERE company_id = ? AND store_id = ?
              ) OR EXISTS (
                SELECT 1 FROM menu_items WHERE company_id = ? AND store_id = ?
              ) OR EXISTS (
                SELECT 1 FROM restaurant_store_settings WHERE company_id = ? AND store_id = ?
              ) THEN 1 ELSE 0 END
            """,
            Integer.class,
            companyId, storeId,
            companyId, storeId,
            companyId, storeId
        );
        return hit != null && hit == 1;
    }
}
