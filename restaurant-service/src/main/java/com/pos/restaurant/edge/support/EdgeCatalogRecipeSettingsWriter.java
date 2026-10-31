package com.pos.restaurant.edge.support;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.RecipeLineRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.RecipeRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ShiftRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.StoreSettingRow;
import com.pos.restaurant.settings.entity.RestaurantStoreSetting;
import com.pos.restaurant.settings.repository.RestaurantStoreSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Store settings, recipes, open shift — SRP. */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCatalogRecipeSettingsWriter {

    private final JdbcTemplate jdbc;
    private final RestaurantStoreSettingRepository storeSettingRepository;

    public Map<String, Object> apply(EdgeCatalogSnapshot snap) {
        Map<String, Object> out = new HashMap<>();
        out.put("storeSettings", upsertStoreSetting(snap));
        out.put("recipes", upsertRecipes(snap));
        out.put("recipeLines", upsertRecipeLines(snap));
        out.put("openShift", upsertOpenShift(snap));
        return out;
    }

    public int upsertStoreSetting(EdgeCatalogSnapshot snap) {
        StoreSettingRow row = snap.storeSetting();
        if (row == null) return 0;
        RestaurantStoreSetting e = storeSettingRepository
            .findByCompanyIdAndStoreId(snap.companyId(), snap.storeId())
            .orElseGet(RestaurantStoreSetting::new);
        // company+store is the key. Cloud and edge mint different UUIDs;
        // setId on an already persistent row aborts the whole catalog import.
        if (e.getId() == null) {
            e.setId(row.id() != null ? row.id() : UUID.randomUUID());
        }
        e.setCompanyId(snap.companyId());
        e.setStoreId(snap.storeId());
        e.setKitchenBoardEnabled(row.kitchenBoardEnabled());
        e.setPrintProfileJson(row.printProfileJson());
        e.setMenuPhotosEnabled(row.menuPhotosEnabled() == null || row.menuPhotosEnabled());
        storeSettingRepository.save(e);
        return 1;
    }

    public int upsertRecipes(EdgeCatalogSnapshot snap) {
        List<RecipeRow> rows = snap.recipes() == null ? List.of() : snap.recipes();
        Instant now = Instant.now();
        int n = 0;
        for (RecipeRow row : rows) {
            if (row.id() == null || row.menuItemId() == null) continue;
            Integer exists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM menu_items WHERE id = ?",
                Integer.class,
                row.menuItemId()
            );
            if (exists == null || exists == 0) continue;
            jdbc.update("""
                INSERT INTO recipes (id, company_id, store_id, menu_item_id, output_qty, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  store_id = EXCLUDED.store_id,
                  menu_item_id = EXCLUDED.menu_item_id,
                  output_qty = EXCLUDED.output_qty,
                  updated_at = EXCLUDED.updated_at
                """,
                row.id(),
                snap.companyId(),
                snap.storeId(),
                row.menuItemId(),
                row.outputQty() == null ? BigDecimal.ONE : row.outputQty(),
                Timestamp.from(now)
            );
            n++;
        }
        return n;
    }

    public int upsertRecipeLines(EdgeCatalogSnapshot snap) {
        List<RecipeLineRow> rows = snap.recipeLines() == null ? List.of() : snap.recipeLines();
        int n = 0;
        for (RecipeLineRow row : rows) {
            if (row.id() == null || row.recipeId() == null || row.productId() == null) continue;
            Integer exists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM recipes WHERE id = ?",
                Integer.class,
                row.recipeId()
            );
            if (exists == null || exists == 0) continue;
            jdbc.update("""
                INSERT INTO recipe_lines
                  (id, recipe_id, product_id, product_name, unit, qty_gross, waste_percent, qty_net, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  recipe_id = EXCLUDED.recipe_id,
                  product_id = EXCLUDED.product_id,
                  product_name = EXCLUDED.product_name,
                  unit = EXCLUDED.unit,
                  qty_gross = EXCLUDED.qty_gross,
                  waste_percent = EXCLUDED.waste_percent,
                  qty_net = EXCLUDED.qty_net,
                  sort_order = EXCLUDED.sort_order
                """,
                row.id(),
                row.recipeId(),
                row.productId(),
                row.productName() == null ? "" : row.productName(),
                StringUtils.hasText(row.unit()) ? row.unit() : "kg",
                row.qtyGross() == null ? BigDecimal.ZERO : row.qtyGross(),
                row.wastePercent() == null ? BigDecimal.ZERO : row.wastePercent(),
                row.qtyNet() == null ? BigDecimal.ZERO : row.qtyNet(),
                row.sortOrder()
            );
            n++;
        }
        return n;
    }

    public int upsertOpenShift(EdgeCatalogSnapshot snap) {
        ShiftRow row = snap.openShift();
        if (row == null || row.id() == null) return 0;
        Instant now = Instant.now();
        // Close any other OPEN shift for this store (unique partial index).
        jdbc.update("""
            UPDATE restaurant_shifts
            SET status = 'CLOSED', closed_at = COALESCE(closed_at, ?)
            WHERE store_id = ? AND status = 'OPEN' AND id <> ?
            """,
            Timestamp.from(now),
            snap.storeId(),
            row.id()
        );
        UUID openedBy = row.openedByUserId() == null ? UUID.randomUUID() : row.openedByUserId();
        Instant openedAt = row.openedAt() == null ? now : row.openedAt();
        jdbc.update("""
            INSERT INTO restaurant_shifts (
              id, company_id, store_id, status, opened_by_user_id, opened_at, opening_cash,
              sale_count, total_amount, cash_amount, card_amount, comment,
              handover_expected, handover_diff
            ) VALUES (?, ?, ?, 'OPEN', ?, ?, ?, 0, 0, 0, 0, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              company_id = EXCLUDED.company_id,
              store_id = EXCLUDED.store_id,
              status = 'OPEN',
              opened_by_user_id = EXCLUDED.opened_by_user_id,
              opened_at = EXCLUDED.opened_at,
              opening_cash = EXCLUDED.opening_cash,
              comment = EXCLUDED.comment,
              handover_expected = EXCLUDED.handover_expected,
              handover_diff = EXCLUDED.handover_diff,
              closed_at = NULL,
              closed_by_user_id = NULL
            """,
            row.id(),
            snap.companyId(),
            snap.storeId(),
            openedBy,
            Timestamp.from(openedAt),
            row.openingCash() == null ? BigDecimal.ZERO : row.openingCash(),
            row.comment(),
            row.handoverExpected(),
            row.handoverDiff()
        );
        return 1;
    }


}
