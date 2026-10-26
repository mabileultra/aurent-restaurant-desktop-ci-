package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogImportRequest;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.CategoryRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.HallRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ItemRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierGroupRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierLinkRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ModifierOptionRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketLineRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderItemModifierRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderItemRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderLinkRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OrderPaymentRow;
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
        int openOrders = upsertOpenOrders(snap);
        int openOrderItems = upsertOpenOrderItems(snap);
        int openOrderLinks = upsertOpenOrderLinks(snap);
        int openOrderItemModifiers = upsertOpenOrderItemModifiers(snap);
        int closedGhosts = reconcileClosedLiveOrders(snap);
        int kitchenTickets = upsertKitchenTickets(snap);
        int kitchenTicketLines = upsertKitchenTicketLines(snap);
        int cancelledTickets = reconcileStaleKitchenTickets(snap);
        int closedOrders = upsertClosedOrders(snap);
        int closedOrderItems = upsertClosedOrderItems(snap);
        int closedOrderItemModifiers = upsertClosedOrderItemModifiers(snap);
        int orderPayments = upsertOrderPayments(snap);

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
        result.put("openOrders", openOrders);
        result.put("openOrderItems", openOrderItems);
        result.put("openOrderLinks", openOrderLinks);
        result.put("openOrderItemModifiers", openOrderItemModifiers);
        result.put("closedGhostOrders", closedGhosts);
        result.put("kitchenTickets", kitchenTickets);
        result.put("kitchenTicketLines", kitchenTicketLines);
        result.put("cancelledStaleTickets", cancelledTickets);
        result.put("closedOrders", closedOrders);
        result.put("closedOrderItems", closedOrderItems);
        result.put("closedOrderItemModifiers", closedOrderItemModifiers);
        result.put("orderPayments", orderPayments);
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
            // Keep cloud status (OCCUPIED/WAITING_PAYMENT/…) — open orders are imported after.
            String status = StringUtils.hasText(row.status()) ? row.status().trim() : "FREE";
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
        // company+store is the key. Cloud and edge mint different UUIDs;
        // setId on an already persistent row aborts the whole catalog import.
        if (e.getId() == null) {
            e.setId(row.id() != null ? row.id() : UUID.randomUUID());
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

    private int upsertClosedOrders(EdgeCatalogSnapshot snap) {
        if (snap.closedOrders() == null) return 0;
        return upsertOrderRows(snap, snap.closedOrders());
    }

    private int upsertClosedOrderItems(EdgeCatalogSnapshot snap) {
        if (snap.closedOrderItems() == null) return 0;
        return upsertOrderItemRows(snap.closedOrderItems());
    }

    private int upsertClosedOrderItemModifiers(EdgeCatalogSnapshot snap) {
        if (snap.closedOrderItemModifiers() == null) return 0;
        return upsertOrderItemModifierRows(snap.closedOrderItemModifiers());
    }

    private int upsertOpenOrders(EdgeCatalogSnapshot snap) {
        List<OpenOrderRow> rows = snap.openOrders() == null ? List.of() : snap.openOrders();
        return upsertOrderRows(snap, rows);
    }

    private int upsertOrderRows(EdgeCatalogSnapshot snap, List<OpenOrderRow> rows) {
        Instant now = Instant.now();
        int n = 0;
        for (OpenOrderRow row : rows) {
            if (row.id() == null) continue;
            Instant openedAt = row.openedAt() == null ? now : row.openedAt();
            Instant updatedAt = row.updatedAt() == null ? openedAt : row.updatedAt();
            UUID openedBy = row.openedByUserId() == null ? UUID.randomUUID() : row.openedByUserId();
            jdbc.update("""
                INSERT INTO floor_orders (
                  id, company_id, store_id, table_id, channel, order_no, status,
                  guest_count, adult_count, children_count,
                  client_name, client_phone, delivery_address, delivery_status,
                  opened_by_user_id, waiter_user_id, courier_user_id,
                  commission_percent, commission_base_amount, commission_amount,
                  service_percent, service_amount, discount_amount, shift_id, comment,
                  opened_at, closed_at, updated_at, pickup_no
                ) VALUES (
                  ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?,
                  ?, ?, ?, ?,
                  ?, ?, ?,
                  ?, ?, ?,
                  ?, ?, ?, ?, ?,
                  ?, ?, ?, ?
                )
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  store_id = EXCLUDED.store_id,
                  table_id = EXCLUDED.table_id,
                  channel = EXCLUDED.channel,
                  order_no = EXCLUDED.order_no,
                  status = EXCLUDED.status,
                  guest_count = EXCLUDED.guest_count,
                  adult_count = EXCLUDED.adult_count,
                  children_count = EXCLUDED.children_count,
                  client_name = EXCLUDED.client_name,
                  client_phone = EXCLUDED.client_phone,
                  delivery_address = EXCLUDED.delivery_address,
                  delivery_status = EXCLUDED.delivery_status,
                  opened_by_user_id = EXCLUDED.opened_by_user_id,
                  waiter_user_id = EXCLUDED.waiter_user_id,
                  courier_user_id = EXCLUDED.courier_user_id,
                  commission_percent = EXCLUDED.commission_percent,
                  commission_base_amount = EXCLUDED.commission_base_amount,
                  commission_amount = EXCLUDED.commission_amount,
                  service_percent = EXCLUDED.service_percent,
                  service_amount = EXCLUDED.service_amount,
                  discount_amount = EXCLUDED.discount_amount,
                  shift_id = EXCLUDED.shift_id,
                  comment = EXCLUDED.comment,
                  opened_at = EXCLUDED.opened_at,
                  closed_at = EXCLUDED.closed_at,
                  updated_at = EXCLUDED.updated_at,
                  pickup_no = EXCLUDED.pickup_no
                """,
                row.id(),
                snap.companyId(),
                snap.storeId(),
                row.tableId(),
                StringUtils.hasText(row.channel()) ? row.channel() : "DINE_IN",
                row.orderNo(),
                StringUtils.hasText(row.status()) ? row.status() : "OPEN",
                row.guestCount(),
                row.adultCount(),
                row.childrenCount(),
                row.clientName(),
                row.clientPhone(),
                row.deliveryAddress(),
                row.deliveryStatus(),
                openedBy,
                row.waiterUserId(),
                row.courierUserId(),
                row.commissionPercent(),
                row.commissionBaseAmount(),
                row.commissionAmount(),
                row.servicePercent(),
                row.serviceAmount(),
                row.discountAmount() == null ? BigDecimal.ZERO : row.discountAmount(),
                row.shiftId(),
                row.comment(),
                Timestamp.from(openedAt),
                row.closedAt() == null ? null : Timestamp.from(row.closedAt()),
                Timestamp.from(updatedAt),
                row.pickupNo()
            );
            n++;
        }
        return n;
    }

    private int upsertOpenOrderItems(EdgeCatalogSnapshot snap) {
        List<OpenOrderItemRow> rows = snap.openOrderItems() == null ? List.of() : snap.openOrderItems();
        return upsertOrderItemRows(rows);
    }

    private int upsertOrderItemRows(List<OpenOrderItemRow> rows) {
        Instant now = Instant.now();
        int n = 0;
        for (OpenOrderItemRow row : rows) {
            if (row.id() == null || row.orderId() == null || !StringUtils.hasText(row.name())) continue;
            Instant createdAt = row.createdAt() == null ? now : row.createdAt();
            Instant updatedAt = row.updatedAt() == null ? createdAt : row.updatedAt();
            // Drop menu_item FK if dish missing locally (still show line by name).
            UUID menuItemId = row.menuItemId();
            if (menuItemId != null) {
                Integer exists = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM menu_items WHERE id = ?",
                    Integer.class,
                    menuItemId
                );
                if (exists == null || exists == 0) menuItemId = null;
            }
            jdbc.update("""
                INSERT INTO floor_order_items (
                  id, order_id, menu_item_id, name, quantity, returned_quantity, sent_quantity,
                  unit_price, tax_rate, station_id, note, item_status, sort_order, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  order_id = EXCLUDED.order_id,
                  menu_item_id = EXCLUDED.menu_item_id,
                  name = EXCLUDED.name,
                  quantity = EXCLUDED.quantity,
                  returned_quantity = EXCLUDED.returned_quantity,
                  sent_quantity = EXCLUDED.sent_quantity,
                  unit_price = EXCLUDED.unit_price,
                  tax_rate = EXCLUDED.tax_rate,
                  station_id = EXCLUDED.station_id,
                  note = EXCLUDED.note,
                  item_status = EXCLUDED.item_status,
                  sort_order = EXCLUDED.sort_order,
                  updated_at = EXCLUDED.updated_at
                """,
                row.id(),
                row.orderId(),
                menuItemId,
                row.name().trim(),
                row.quantity() == null ? BigDecimal.ONE : row.quantity(),
                row.returnedQuantity() == null ? BigDecimal.ZERO : row.returnedQuantity(),
                row.sentQuantity() == null ? BigDecimal.ZERO : row.sentQuantity(),
                row.unitPrice() == null ? BigDecimal.ZERO : row.unitPrice(),
                row.taxRate() == null ? BigDecimal.ZERO : row.taxRate(),
                row.stationId(),
                row.note(),
                StringUtils.hasText(row.itemStatus()) ? row.itemStatus() : "NEW",
                row.sortOrder(),
                Timestamp.from(createdAt),
                Timestamp.from(updatedAt)
            );
            n++;
        }
        return n;
    }

    private int upsertOpenOrderLinks(EdgeCatalogSnapshot snap) {
        List<OpenOrderLinkRow> rows = snap.openOrderLinks() == null ? List.of() : snap.openOrderLinks();
        Instant now = Instant.now();
        int n = 0;
        for (OpenOrderLinkRow row : rows) {
            if (row.id() == null || row.orderId() == null || row.tableId() == null) continue;
            Instant linkedAt = row.linkedAt() == null ? now : row.linkedAt();
            // Unique on table_id — clear stale link before upsert.
            jdbc.update("DELETE FROM floor_order_table_links WHERE table_id = ? OR id = ?", row.tableId(), row.id());
            jdbc.update("""
                INSERT INTO floor_order_table_links (id, order_id, table_id, linked_at, linked_by_user_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                row.id(),
                row.orderId(),
                row.tableId(),
                Timestamp.from(linkedAt),
                row.linkedByUserId()
            );
            n++;
        }
        return n;
    }

    private int upsertOpenOrderItemModifiers(EdgeCatalogSnapshot snap) {
        List<OpenOrderItemModifierRow> rows =
            snap.openOrderItemModifiers() == null ? List.of() : snap.openOrderItemModifiers();
        return upsertOrderItemModifierRows(rows);
    }

    private int upsertOrderItemModifierRows(List<OpenOrderItemModifierRow> rows) {
        int n = 0;
        for (OpenOrderItemModifierRow row : rows) {
            if (row.id() == null || row.orderItemId() == null || !StringUtils.hasText(row.name())) continue;
            Integer itemExists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_order_items WHERE id = ?",
                Integer.class,
                row.orderItemId()
            );
            if (itemExists == null || itemExists == 0) continue;
            jdbc.update("""
                INSERT INTO floor_order_item_modifiers (id, order_item_id, option_id, name, price_delta)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  order_item_id = EXCLUDED.order_item_id,
                  option_id = EXCLUDED.option_id,
                  name = EXCLUDED.name,
                  price_delta = EXCLUDED.price_delta
                """,
                row.id(),
                row.orderItemId(),
                row.optionId(),
                row.name().trim(),
                row.priceDelta() == null ? BigDecimal.ZERO : row.priceDelta()
            );
            n++;
        }
        return n;
    }

    /**
     * Close local OPEN/BILLING orders that cloud no longer reports as live
     * (paid/closed elsewhere — otherwise hall PC shows ghosts).
     */
    private int reconcileClosedLiveOrders(EdgeCatalogSnapshot snap) {
        // null = old cloud jar without live export — do not wipe local floor
        if (snap.openOrders() == null) return 0;
        List<OpenOrderRow> rows = snap.openOrders();
        Set<UUID> keep = new HashSet<>();
        for (OpenOrderRow row : rows) {
            if (row.id() != null) keep.add(row.id());
        }
        Instant now = Instant.now();
        if (keep.isEmpty()) {
            return jdbc.update("""
                UPDATE floor_orders
                SET status = 'CLOSED', closed_at = COALESCE(closed_at, ?), updated_at = ?
                WHERE company_id = ? AND store_id = ? AND status IN ('OPEN', 'BILLING')
                """,
                Timestamp.from(now), Timestamp.from(now), snap.companyId(), snap.storeId()
            );
        }
        String placeholders = String.join(",", keep.stream().map(id -> "?").toList());
        Object[] args = new Object[keep.size() + 4];
        int i = 0;
        args[i++] = Timestamp.from(now);
        args[i++] = Timestamp.from(now);
        args[i++] = snap.companyId();
        args[i++] = snap.storeId();
        for (UUID id : keep) args[i++] = id;
        return jdbc.update("""
            UPDATE floor_orders
            SET status = 'CLOSED', closed_at = COALESCE(closed_at, ?), updated_at = ?
            WHERE company_id = ? AND store_id = ? AND status IN ('OPEN', 'BILLING')
              AND id NOT IN (%s)
            """.formatted(placeholders),
            args
        );
    }

    private int upsertKitchenTickets(EdgeCatalogSnapshot snap) {
        List<KitchenTicketRow> rows = snap.kitchenTickets() == null ? List.of() : snap.kitchenTickets();
        Instant now = Instant.now();
        int n = 0;
        for (KitchenTicketRow row : rows) {
            if (row.id() == null || row.orderId() == null) continue;
            Integer orderExists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_orders WHERE id = ?",
                Integer.class,
                row.orderId()
            );
            if (orderExists == null || orderExists == 0) continue;
            UUID stationId = row.stationId();
            if (stationId != null) {
                Integer st = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM kitchen_stations WHERE id = ?",
                    Integer.class,
                    stationId
                );
                if (st == null || st == 0) stationId = null;
            }
            Instant sentAt = row.sentAt() == null ? now : row.sentAt();
            Instant updatedAt = row.updatedAt() == null ? sentAt : row.updatedAt();
            jdbc.update("""
                INSERT INTO kitchen_tickets (
                  id, company_id, store_id, order_id, station_id, status, sent_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  store_id = EXCLUDED.store_id,
                  order_id = EXCLUDED.order_id,
                  station_id = EXCLUDED.station_id,
                  status = EXCLUDED.status,
                  sent_at = EXCLUDED.sent_at,
                  updated_at = EXCLUDED.updated_at
                """,
                row.id(),
                snap.companyId(),
                snap.storeId(),
                row.orderId(),
                stationId,
                StringUtils.hasText(row.status()) ? row.status() : "NEW",
                Timestamp.from(sentAt),
                Timestamp.from(updatedAt)
            );
            n++;
        }
        return n;
    }

    private int upsertKitchenTicketLines(EdgeCatalogSnapshot snap) {
        List<KitchenTicketLineRow> rows =
            snap.kitchenTicketLines() == null ? List.of() : snap.kitchenTicketLines();
        int n = 0;
        for (KitchenTicketLineRow row : rows) {
            if (row.id() == null || row.ticketId() == null || row.orderItemId() == null) continue;
            Integer ticketOk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM kitchen_tickets WHERE id = ?",
                Integer.class,
                row.ticketId()
            );
            Integer itemOk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_order_items WHERE id = ?",
                Integer.class,
                row.orderItemId()
            );
            if (ticketOk == null || ticketOk == 0 || itemOk == null || itemOk == 0) continue;
            jdbc.update("""
                INSERT INTO kitchen_ticket_lines (id, ticket_id, order_item_id, quantity)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  ticket_id = EXCLUDED.ticket_id,
                  order_item_id = EXCLUDED.order_item_id,
                  quantity = EXCLUDED.quantity
                """,
                row.id(),
                row.ticketId(),
                row.orderItemId(),
                row.quantity()
            );
            n++;
        }
        return n;
    }

    private int upsertOrderPayments(EdgeCatalogSnapshot snap) {
        if (snap.orderPayments() == null) return 0;
        List<OrderPaymentRow> rows = snap.orderPayments();
        Instant now = Instant.now();
        int n = 0;
        for (OrderPaymentRow row : rows) {
            if (row.id() == null || row.orderId() == null) continue;
            Integer orderOk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_orders WHERE id = ?",
                Integer.class,
                row.orderId()
            );
            if (orderOk == null || orderOk == 0) continue;
            Instant paidAt = row.paidAt() == null ? now : row.paidAt();
            UUID paidBy = row.paidByUserId() == null ? UUID.randomUUID() : row.paidByUserId();
            jdbc.update("""
                INSERT INTO floor_order_payments (
                  id, order_id, method, amount, cash_amount, card_amount,
                  amount_tendered, change_given, card_type,
                  debt_phone, debt_comment, advance_paid, debt_remaining,
                  paid_by_user_id, paid_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  order_id = EXCLUDED.order_id,
                  method = EXCLUDED.method,
                  amount = EXCLUDED.amount,
                  cash_amount = EXCLUDED.cash_amount,
                  card_amount = EXCLUDED.card_amount,
                  amount_tendered = EXCLUDED.amount_tendered,
                  change_given = EXCLUDED.change_given,
                  card_type = EXCLUDED.card_type,
                  debt_phone = EXCLUDED.debt_phone,
                  debt_comment = EXCLUDED.debt_comment,
                  advance_paid = EXCLUDED.advance_paid,
                  debt_remaining = EXCLUDED.debt_remaining,
                  paid_by_user_id = EXCLUDED.paid_by_user_id,
                  paid_at = EXCLUDED.paid_at
                """,
                row.id(),
                row.orderId(),
                StringUtils.hasText(row.method()) ? row.method() : "CASH",
                row.amount() == null ? BigDecimal.ZERO : row.amount(),
                row.cashAmount() == null ? BigDecimal.ZERO : row.cashAmount(),
                row.cardAmount() == null ? BigDecimal.ZERO : row.cardAmount(),
                row.amountTendered() == null
                    ? (row.amount() == null ? BigDecimal.ZERO : row.amount())
                    : row.amountTendered(),
                row.changeGiven() == null ? BigDecimal.ZERO : row.changeGiven(),
                row.cardType(),
                row.debtPhone(),
                row.debtComment(),
                row.advancePaid(),
                row.debtRemaining(),
                paidBy,
                Timestamp.from(paidAt)
            );
            n++;
        }
        return n;
    }

    private int reconcileStaleKitchenTickets(EdgeCatalogSnapshot snap) {
        if (snap.kitchenTickets() == null) return 0;
        List<KitchenTicketRow> rows = snap.kitchenTickets();
        Set<UUID> keep = new HashSet<>();
        for (KitchenTicketRow row : rows) {
            if (row.id() != null) keep.add(row.id());
        }
        Instant now = Instant.now();
        if (keep.isEmpty()) {
            return jdbc.update("""
                UPDATE kitchen_tickets
                SET status = 'CANCELLED', updated_at = ?
                WHERE company_id = ? AND store_id = ?
                  AND status NOT IN ('SERVED', 'CANCELLED')
                """,
                Timestamp.from(now), snap.companyId(), snap.storeId()
            );
        }
        String placeholders = String.join(",", keep.stream().map(id -> "?").toList());
        Object[] args = new Object[keep.size() + 3];
        int i = 0;
        args[i++] = Timestamp.from(now);
        args[i++] = snap.companyId();
        args[i++] = snap.storeId();
        for (UUID id : keep) args[i++] = id;
        return jdbc.update("""
            UPDATE kitchen_tickets
            SET status = 'CANCELLED', updated_at = ?
            WHERE company_id = ? AND store_id = ?
              AND status NOT IN ('SERVED', 'CANCELLED')
              AND id NOT IN (%s)
            """.formatted(placeholders),
            args
        );
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
