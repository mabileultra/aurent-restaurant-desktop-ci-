package com.pos.restaurant.edge.support;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierGroupRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierLinkRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierOptionRow;
import com.pos.restaurant.modifier.domain.ModifierGroupKind;
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

/** Modifiers slice of edge catalog bootstrap — SRP. */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCatalogModifierWriter {

    private final JdbcTemplate jdbc;

    public Map<String, Object> apply(EdgeCatalogSnapshot snap) {
        Map<String, Object> out = new HashMap<>();
        out.put("modifierGroups", upsertModifierGroups(snap));
        out.put("modifierOptions", upsertModifierOptions(snap));
        out.put("modifierLinks", upsertModifierLinks(snap));
        return out;
    }

    public int upsertModifierGroups(EdgeCatalogSnapshot snap) {
        List<ModifierGroupRow> rows = snap.modifierGroups() == null ? List.of() : snap.modifierGroups();
        Instant now = Instant.now();
        int n = 0;
        for (ModifierGroupRow row : rows) {
            if (row.id() == null || !StringUtils.hasText(row.name())) continue;
            String kind = parseEnum(ModifierGroupKind.class, row.groupKind(), ModifierGroupKind.STANDARD).name();
            jdbc.update("""
                INSERT INTO modifier_groups
                  (id, company_id, store_id, name, group_kind, min_select, max_select, sort_order,
                   available_for_all, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  store_id = EXCLUDED.store_id,
                  name = EXCLUDED.name,
                  group_kind = EXCLUDED.group_kind,
                  min_select = EXCLUDED.min_select,
                  max_select = EXCLUDED.max_select,
                  sort_order = EXCLUDED.sort_order,
                  available_for_all = EXCLUDED.available_for_all,
                  active = EXCLUDED.active,
                  updated_at = EXCLUDED.updated_at
                """,
                row.id(),
                snap.companyId(),
                snap.storeId(),
                row.name().trim(),
                kind,
                row.minSelect(),
                row.maxSelect(),
                row.sortOrder(),
                row.availableForAll(),
                row.active(),
                Timestamp.from(now),
                Timestamp.from(now)
            );
            n++;
        }
        return n;
    }

    public int upsertModifierOptions(EdgeCatalogSnapshot snap) {
        List<ModifierOptionRow> rows = snap.modifierOptions() == null ? List.of() : snap.modifierOptions();
        int n = 0;
        for (ModifierOptionRow row : rows) {
            if (row.id() == null || row.groupId() == null || !StringUtils.hasText(row.name())) continue;
            jdbc.update("""
                INSERT INTO modifier_options
                  (id, group_id, name, price_delta, sort_order, active)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  group_id = EXCLUDED.group_id,
                  name = EXCLUDED.name,
                  price_delta = EXCLUDED.price_delta,
                  sort_order = EXCLUDED.sort_order,
                  active = EXCLUDED.active
                """,
                row.id(),
                row.groupId(),
                row.name().trim(),
                row.priceDelta() == null ? BigDecimal.ZERO : row.priceDelta(),
                row.sortOrder(),
                row.active()
            );
            n++;
        }
        return n;
    }

    public int upsertModifierLinks(EdgeCatalogSnapshot snap) {
        List<ModifierLinkRow> rows = snap.modifierLinks() == null ? List.of() : snap.modifierLinks();
        int n = 0;
        for (ModifierLinkRow row : rows) {
            if (row.menuItemId() == null || row.groupId() == null) continue;
            int updated = jdbc.update("""
                INSERT INTO menu_item_modifier_groups (menu_item_id, group_id)
                VALUES (?, ?)
                ON CONFLICT DO NOTHING
                """,
                row.menuItemId(),
                row.groupId()
            );
            n += updated;
        }
        return n;
    }



    private static <E extends Enum<E>> E parseEnum(Class<E> type, String raw, E fallback) {
        if (!org.springframework.util.StringUtils.hasText(raw)) return fallback;
        try {
            return Enum.valueOf(type, raw.trim());
        } catch (Exception ex) {
            return fallback;
        }
    }

}
