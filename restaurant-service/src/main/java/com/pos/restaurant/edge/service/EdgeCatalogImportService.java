package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogImportRequest;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.CategoryRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.HallRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ItemRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierGroupRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierLinkRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierOptionRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.RecipeLineRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.RecipeRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ShiftRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.StationRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.StoreSettingRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.TableRow;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.repository.FloorHallRepository;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.domain.MenuPortionUnit;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.modifier.domain.ModifierGroupKind;
import com.pos.restaurant.modifier.entity.MenuItemModifierLink;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.entity.ModifierOption;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import com.pos.restaurant.modifier.repository.ModifierOptionRepository;
import com.pos.restaurant.recipe.entity.Recipe;
import com.pos.restaurant.recipe.entity.RecipeLine;
import com.pos.restaurant.recipe.repository.RecipeLineRepository;
import com.pos.restaurant.recipe.repository.RecipeRepository;
import com.pos.restaurant.settings.entity.RestaurantStoreSetting;
import com.pos.restaurant.settings.repository.RestaurantStoreSettingRepository;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.repository.RestaurantShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCatalogImportService {

    private final JdbcTemplate jdbc;
    private final FloorHallRepository hallRepository;
    private final KitchenStationRepository stationRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final ModifierGroupRepository modifierGroupRepository;
    private final ModifierOptionRepository modifierOptionRepository;
    private final MenuItemModifierLinkRepository modifierLinkRepository;
    private final RestaurantStoreSettingRepository storeSettingRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeLineRepository recipeLineRepository;
    private final RestaurantShiftRepository shiftRepository;
    private final ObjectProvider<EdgeStoreService> edgeStoreService;

    @Value("${app.restaurant.edge.bootstrap-secret:}")
    private String bootstrapSecret;

    @Transactional
    public Map<String, Object> importSnapshot(EdgeCatalogImportRequest request) {
        EdgeCatalogSnapshot snap = request.snapshot();
        if (snap == null || snap.companyId() == null || snap.storeId() == null) {
            throw new BusinessException("Invalid catalog snapshot");
        }
        if (StringUtils.hasText(bootstrapSecret)
            && !bootstrapSecret.equals(String.valueOf(request.bootstrapSecret()))) {
            // Allow when local halls already exist (re-sync) OR secret matches
            if (!hasCatalog(snap.companyId(), snap.storeId())) {
                throw new BusinessException("Invalid bootstrap secret");
            }
        }

        int halls = upsertHalls(snap);
        int tables = upsertTables(snap);
        int stations = upsertStations(snap);
        int categories = upsertCategories(snap);
        int items = upsertItems(snap);
        int groups = upsertModifierGroups(snap);
        int options = upsertModifierOptions(snap);
        int links = upsertModifierLinks(snap);
        int settings = upsertStoreSetting(snap);
        int recipes = upsertRecipes(snap);
        int recipeLines = upsertRecipeLines(snap);
        int shifts = upsertOpenShift(snap);

        EdgeStoreService stores = edgeStoreService.getIfAvailable();
        if (stores != null) {
            stores.upsertFromCatalog(snap.companyId(), snap.storeId());
        }

        syncSequences();

        Map<String, Object> result = new HashMap<>();
        result.put("halls", halls);
        result.put("tables", tables);
        result.put("stations", stations);
        result.put("categories", categories);
        result.put("items", items);
        result.put("modifierGroups", groups);
        result.put("modifierOptions", options);
        result.put("modifierLinks", links);
        result.put("storeSettings", settings);
        result.put("recipes", recipes);
        result.put("recipeLines", recipeLines);
        result.put("openShift", shifts);
        result.put("hasCatalog", hasCatalog(snap.companyId(), snap.storeId()));
        result.put("companyId", snap.companyId());
        result.put("storeId", snap.storeId());
        return result;
    }

    @Transactional(readOnly = true)
    public boolean hasCatalog(Integer companyId, Integer storeId) {
        if (companyId == null || storeId == null) {
            return hasAnyCatalog();
        }
        Integer halls = jdbc.queryForObject(
            "SELECT COUNT(*) FROM floor_halls WHERE company_id = ? AND store_id = ?",
            Integer.class,
            companyId,
            storeId
        );
        if (halls != null && halls > 0) return true;
        Integer items = jdbc.queryForObject(
            "SELECT COUNT(*) FROM menu_items WHERE company_id = ? AND store_id = ?",
            Integer.class,
            companyId,
            storeId
        );
        return items != null && items > 0;
    }

    @Transactional(readOnly = true)
    public boolean hasAnyCatalog() {
        Integer halls = jdbc.queryForObject("SELECT COUNT(*) FROM floor_halls", Integer.class);
        if (halls != null && halls > 0) return true;
        Integer items = jdbc.queryForObject("SELECT COUNT(*) FROM menu_items", Integer.class);
        return items != null && items > 0;
    }

    private int upsertHalls(EdgeCatalogSnapshot snap) {
        List<HallRow> rows = snap.halls() == null ? List.of() : snap.halls();
        Instant now = Instant.now();
        for (HallRow row : rows) {
            if (row.id() == null) continue;
            jdbc.update("""
                INSERT INTO floor_halls
                  (id, company_id, store_id, name, sort_order, active, service_percent, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  store_id = EXCLUDED.store_id,
                  name = EXCLUDED.name,
                  sort_order = EXCLUDED.sort_order,
                  active = EXCLUDED.active,
                  service_percent = EXCLUDED.service_percent,
                  updated_at = EXCLUDED.updated_at
                """,
                row.id(),
                snap.companyId(),
                snap.storeId(),
                row.name(),
                row.sortOrder(),
                row.active(),
                row.servicePercent() == null ? BigDecimal.ZERO : row.servicePercent(),
                Timestamp.from(now),
                Timestamp.from(now)
            );
        }
        return rows.size();
    }

    private int upsertTables(EdgeCatalogSnapshot snap) {
        List<TableRow> rows = snap.tables() == null ? List.of() : snap.tables();
        Instant now = Instant.now();
        for (TableRow row : rows) {
            if (row.id() == null || row.hallId() == null) continue;
            String status = StringUtils.hasText(row.status()) ? row.status() : "FREE";
            // Bootstrap: free tables locally even if cloud had occupied — no open orders yet
            if (!"FREE".equals(status) && !"RESERVED".equals(status)) {
                status = "FREE";
            }
            jdbc.update("""
                INSERT INTO floor_tables
                  (id, hall_id, company_id, store_id, code, label, seat_count, service_percent,
                   pos_x, pos_y, width, height, status, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  hall_id = EXCLUDED.hall_id,
                  company_id = EXCLUDED.company_id,
                  store_id = EXCLUDED.store_id,
                  code = EXCLUDED.code,
                  label = EXCLUDED.label,
                  seat_count = EXCLUDED.seat_count,
                  service_percent = EXCLUDED.service_percent,
                  pos_x = EXCLUDED.pos_x,
                  pos_y = EXCLUDED.pos_y,
                  width = EXCLUDED.width,
                  height = EXCLUDED.height,
                  status = EXCLUDED.status,
                  active = EXCLUDED.active,
                  updated_at = EXCLUDED.updated_at
                """,
                row.id(),
                row.hallId(),
                snap.companyId(),
                snap.storeId(),
                row.code(),
                row.label(),
                row.seatCount(),
                row.servicePercent(),
                row.posX(),
                row.posY(),
                row.width() <= 0 ? 80 : row.width(),
                row.height() <= 0 ? 80 : row.height(),
                status,
                row.active(),
                Timestamp.from(now),
                Timestamp.from(now)
            );
        }
        return rows.size();
    }

    private int upsertStations(EdgeCatalogSnapshot snap) {
        // JDBC: Menu/Kitchen entities use @GeneratedValue(UUID) — JPA save() would mint new ids
        // and break FK links from the cloud snapshot.
        List<StationRow> rows = snap.stations() == null ? List.of() : snap.stations();
        Instant now = Instant.now();
        int n = 0;
        for (StationRow row : rows) {
            if (row.id() == null) continue;
            String code = StringUtils.hasText(row.code()) ? row.code().trim() : ("S" + row.id().toString().substring(0, 8));
            String name = StringUtils.hasText(row.name()) ? row.name().trim() : code;
            jdbc.update("""
                INSERT INTO kitchen_stations
                  (id, company_id, store_id, code, name, sort_order, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  store_id = EXCLUDED.store_id,
                  code = EXCLUDED.code,
                  name = EXCLUDED.name,
                  sort_order = EXCLUDED.sort_order,
                  active = EXCLUDED.active,
                  updated_at = EXCLUDED.updated_at
                """,
                row.id(),
                snap.companyId(),
                snap.storeId(),
                code,
                name,
                row.sortOrder(),
                row.active(),
                Timestamp.from(now),
                Timestamp.from(now)
            );
            n++;
        }
        return n;
    }

    private int upsertCategories(EdgeCatalogSnapshot snap) {
        List<CategoryRow> rows = snap.categories() == null ? List.of() : snap.categories();
        Instant now = Instant.now();
        Set<UUID> known = new HashSet<>();
        for (CategoryRow row : rows) {
            if (row.id() == null) continue;
            upsertCategoryRow(
                row.id(),
                snap.companyId(),
                snap.storeId(),
                StringUtils.hasText(row.name()) ? row.name().trim() : "Раздел",
                row.sortOrder(),
                row.active(),
                row.autoPrint(),
                row.printPrinterName(),
                now
            );
            known.add(row.id());
        }
        // Orphan item → category FKs (deleted/moved categories on cloud)
        List<ItemRow> items = snap.items() == null ? List.of() : snap.items();
        for (ItemRow item : items) {
            UUID catId = item.menuCategoryId();
            if (catId == null || known.contains(catId)) continue;
            String stubName = StringUtils.hasText(item.category()) ? item.category().trim() : "Раздел";
            upsertCategoryRow(catId, snap.companyId(), snap.storeId(), stubName, 900, true, false, null, now);
            known.add(catId);
        }
        return known.size();
    }

    private void upsertCategoryRow(
        UUID id,
        Integer companyId,
        Integer storeId,
        String name,
        int sortOrder,
        boolean active,
        boolean autoPrint,
        String printPrinterName,
        Instant now
    ) {
        jdbc.update("""
            INSERT INTO menu_categories
              (id, company_id, store_id, name, sort_order, active, auto_print, print_printer_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              company_id = EXCLUDED.company_id,
              store_id = EXCLUDED.store_id,
              name = EXCLUDED.name,
              sort_order = EXCLUDED.sort_order,
              active = EXCLUDED.active,
              auto_print = EXCLUDED.auto_print,
              print_printer_name = EXCLUDED.print_printer_name,
              updated_at = EXCLUDED.updated_at
            """,
            id,
            companyId,
            storeId,
            name,
            sortOrder,
            active,
            autoPrint,
            printPrinterName,
            Timestamp.from(now),
            Timestamp.from(now)
        );
    }

    private int upsertItems(EdgeCatalogSnapshot snap) {
        List<ItemRow> rows = snap.items() == null ? List.of() : snap.items();
        Instant now = Instant.now();
        Set<UUID> stationIds = new HashSet<>();
        if (snap.stations() != null) {
            for (StationRow s : snap.stations()) {
                if (s != null && s.id() != null) stationIds.add(s.id());
            }
        }
        int n = 0;
        for (ItemRow row : rows) {
            if (row.id() == null || !StringUtils.hasText(row.name())) continue;
            UUID stationId = row.stationId() != null && stationIds.contains(row.stationId())
                ? row.stationId()
                : null;
            String itemType = parseEnum(MenuItemType.class, row.itemType(), MenuItemType.DISH).name();
            MenuPortionUnit portionUnit = parseEnum(MenuPortionUnit.class, row.portionUnit(), null);
            jdbc.update("""
                INSERT INTO menu_items (
                  id, company_id, store_id, item_type, name, sku, price, tax_rate, active, available,
                  station_id, category, menu_category_id, image_url, description, prep_minutes,
                  portion_grams, portion_amount, portion_unit, portion_label, variant_group_id, tags,
                  ikpu, package_code, unit_of_measure, unit_measure_code, barcode, marked_product,
                  sort_order, created_at, updated_at
                ) VALUES (
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?,
                  ?, ?, ?
                )
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  store_id = EXCLUDED.store_id,
                  item_type = EXCLUDED.item_type,
                  name = EXCLUDED.name,
                  sku = EXCLUDED.sku,
                  price = EXCLUDED.price,
                  tax_rate = EXCLUDED.tax_rate,
                  active = EXCLUDED.active,
                  available = EXCLUDED.available,
                  station_id = EXCLUDED.station_id,
                  category = EXCLUDED.category,
                  menu_category_id = EXCLUDED.menu_category_id,
                  image_url = EXCLUDED.image_url,
                  description = EXCLUDED.description,
                  prep_minutes = EXCLUDED.prep_minutes,
                  portion_grams = EXCLUDED.portion_grams,
                  portion_amount = EXCLUDED.portion_amount,
                  portion_unit = EXCLUDED.portion_unit,
                  portion_label = EXCLUDED.portion_label,
                  variant_group_id = EXCLUDED.variant_group_id,
                  tags = EXCLUDED.tags,
                  ikpu = EXCLUDED.ikpu,
                  package_code = EXCLUDED.package_code,
                  unit_of_measure = EXCLUDED.unit_of_measure,
                  unit_measure_code = EXCLUDED.unit_measure_code,
                  barcode = EXCLUDED.barcode,
                  marked_product = EXCLUDED.marked_product,
                  sort_order = EXCLUDED.sort_order,
                  updated_at = EXCLUDED.updated_at
                """,
                row.id(),
                snap.companyId(),
                snap.storeId(),
                itemType,
                row.name().trim(),
                row.sku(),
                row.price() == null ? BigDecimal.ZERO : row.price(),
                row.taxRate() == null ? BigDecimal.ZERO : row.taxRate(),
                row.active(),
                row.available(),
                stationId,
                row.category(),
                row.menuCategoryId(),
                row.imageUrl(),
                row.description(),
                row.prepMinutes(),
                row.portionGrams(),
                row.portionAmount(),
                portionUnit == null ? null : portionUnit.name(),
                row.portionLabel(),
                row.variantGroupId(),
                row.tags(),
                row.ikpu(),
                row.packageCode(),
                row.unitOfMeasure(),
                row.unitMeasureCode(),
                row.barcode(),
                row.markedProduct(),
                row.sortOrder(),
                Timestamp.from(now),
                Timestamp.from(now)
            );
            n++;
        }
        return n;
    }

    private int upsertModifierGroups(EdgeCatalogSnapshot snap) {
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

    private int upsertModifierOptions(EdgeCatalogSnapshot snap) {
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

    private int upsertModifierLinks(EdgeCatalogSnapshot snap) {
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

    private int upsertStoreSetting(EdgeCatalogSnapshot snap) {
        StoreSettingRow row = snap.storeSetting();
        if (row == null) return 0;
        RestaurantStoreSetting e = storeSettingRepository
            .findByCompanyIdAndStoreId(snap.companyId(), snap.storeId())
            .orElseGet(RestaurantStoreSetting::new);
        if (row.id() != null) {
            e.setId(row.id());
        } else if (e.getId() == null) {
            e.setId(UUID.randomUUID());
        }
        e.setCompanyId(snap.companyId());
        e.setStoreId(snap.storeId());
        e.setKitchenBoardEnabled(row.kitchenBoardEnabled());
        e.setPrintProfileJson(row.printProfileJson());
        storeSettingRepository.save(e);
        return 1;
    }

    private int upsertRecipes(EdgeCatalogSnapshot snap) {
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

    private int upsertRecipeLines(EdgeCatalogSnapshot snap) {
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

    private int upsertOpenShift(EdgeCatalogSnapshot snap) {
        ShiftRow row = snap.openShift();
        if (row == null || row.id() == null) return 0;
        // Only one OPEN shift per store locally
        shiftRepository.findByStoreIdAndStatus(snap.storeId(), RestaurantShiftStatus.OPEN)
            .ifPresent(existing -> {
                if (!existing.getId().equals(row.id())) {
                    existing.setStatus(RestaurantShiftStatus.CLOSED);
                    existing.setClosedAt(Instant.now());
                    shiftRepository.save(existing);
                }
            });
        RestaurantShift e = shiftRepository.findById(row.id()).orElseGet(RestaurantShift::new);
        e.setId(row.id());
        e.setCompanyId(snap.companyId());
        e.setStoreId(snap.storeId());
        e.setStatus(RestaurantShiftStatus.OPEN);
        e.setOpenedByUserId(row.openedByUserId() == null ? UUID.randomUUID() : row.openedByUserId());
        e.setOpenedAt(row.openedAt() == null ? Instant.now() : row.openedAt());
        e.setOpeningCash(row.openingCash() == null ? BigDecimal.ZERO : row.openingCash());
        e.setHandoverExpected(row.handoverExpected());
        e.setHandoverDiff(row.handoverDiff());
        e.setComment(row.comment());
        shiftRepository.save(e);
        return 1;
    }

    private void syncSequences() {
        try {
            jdbc.execute("SELECT setval(pg_get_serial_sequence('floor_halls','id'), COALESCE((SELECT MAX(id) FROM floor_halls), 1))");
            jdbc.execute("SELECT setval(pg_get_serial_sequence('floor_tables','id'), COALESCE((SELECT MAX(id) FROM floor_tables), 1))");
        } catch (Exception ignored) {
            /* non-postgres or empty */
        }
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> type, String raw, E fallback) {
        if (!StringUtils.hasText(raw)) return fallback;
        try {
            return Enum.valueOf(type, raw.trim());
        } catch (Exception ex) {
            return fallback;
        }
    }
}
