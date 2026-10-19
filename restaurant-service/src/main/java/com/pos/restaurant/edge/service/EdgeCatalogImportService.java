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
import com.pos.restaurant.kitchen.entity.KitchenStation;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.domain.MenuPortionUnit;
import com.pos.restaurant.menu.entity.MenuCategory;
import com.pos.restaurant.menu.entity.MenuItem;
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
import java.util.List;
import java.util.Map;
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
            return hallRepository.count() > 0 || itemRepository.count() > 0;
        }
        return !hallRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId)
            .isEmpty()
            || !itemRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId)
            .isEmpty();
    }

    @Transactional(readOnly = true)
    public boolean hasAnyCatalog() {
        return hallRepository.count() > 0 || itemRepository.count() > 0;
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
        List<StationRow> rows = snap.stations() == null ? List.of() : snap.stations();
        for (StationRow row : rows) {
            if (row.id() == null) continue;
            KitchenStation e = stationRepository.findById(row.id()).orElseGet(KitchenStation::new);
            e.setId(row.id());
            e.setCompanyId(snap.companyId());
            e.setStoreId(snap.storeId());
            e.setCode(row.code());
            e.setName(row.name());
            e.setSortOrder(row.sortOrder());
            e.setActive(row.active());
            stationRepository.save(e);
        }
        return rows.size();
    }

    private int upsertCategories(EdgeCatalogSnapshot snap) {
        List<CategoryRow> rows = snap.categories() == null ? List.of() : snap.categories();
        for (CategoryRow row : rows) {
            if (row.id() == null) continue;
            MenuCategory e = categoryRepository.findById(row.id()).orElseGet(MenuCategory::new);
            e.setId(row.id());
            e.setCompanyId(snap.companyId());
            e.setStoreId(snap.storeId());
            e.setName(row.name());
            e.setSortOrder(row.sortOrder());
            e.setActive(row.active());
            e.setAutoPrint(row.autoPrint());
            e.setPrintPrinterName(row.printPrinterName());
            categoryRepository.save(e);
        }
        return rows.size();
    }

    private int upsertItems(EdgeCatalogSnapshot snap) {
        List<ItemRow> rows = snap.items() == null ? List.of() : snap.items();
        for (ItemRow row : rows) {
            if (row.id() == null) continue;
            MenuItem e = itemRepository.findById(row.id()).orElseGet(MenuItem::new);
            e.setId(row.id());
            e.setCompanyId(snap.companyId());
            e.setStoreId(snap.storeId());
            e.setItemType(parseEnum(MenuItemType.class, row.itemType(), MenuItemType.DISH));
            e.setName(row.name());
            e.setSku(row.sku());
            e.setPrice(row.price() == null ? BigDecimal.ZERO : row.price());
            e.setTaxRate(row.taxRate() == null ? BigDecimal.ZERO : row.taxRate());
            e.setActive(row.active());
            e.setAvailable(row.available());
            e.setStationId(row.stationId());
            e.setCategory(row.category());
            e.setMenuCategoryId(row.menuCategoryId());
            e.setImageUrl(row.imageUrl());
            e.setDescription(row.description());
            e.setPrepMinutes(row.prepMinutes());
            e.setPortionGrams(row.portionGrams());
            e.setPortionAmount(row.portionAmount());
            e.setPortionUnit(parseEnum(MenuPortionUnit.class, row.portionUnit(), null));
            e.setPortionLabel(row.portionLabel());
            e.setVariantGroupId(row.variantGroupId());
            e.setTags(row.tags());
            e.setIkpu(row.ikpu());
            e.setPackageCode(row.packageCode());
            e.setUnitOfMeasure(row.unitOfMeasure());
            e.setUnitMeasureCode(row.unitMeasureCode());
            e.setBarcode(row.barcode());
            e.setMarkedProduct(row.markedProduct());
            e.setSortOrder(row.sortOrder());
            itemRepository.save(e);
        }
        return rows.size();
    }

    private int upsertModifierGroups(EdgeCatalogSnapshot snap) {
        List<ModifierGroupRow> rows = snap.modifierGroups() == null ? List.of() : snap.modifierGroups();
        for (ModifierGroupRow row : rows) {
            if (row.id() == null) continue;
            ModifierGroup e = modifierGroupRepository.findById(row.id()).orElseGet(ModifierGroup::new);
            e.setId(row.id());
            e.setCompanyId(snap.companyId());
            e.setStoreId(snap.storeId());
            e.setName(row.name());
            e.setGroupKind(parseEnum(ModifierGroupKind.class, row.groupKind(), ModifierGroupKind.STANDARD));
            e.setMinSelect(row.minSelect());
            e.setMaxSelect(row.maxSelect());
            e.setSortOrder(row.sortOrder());
            e.setAvailableForAll(row.availableForAll());
            e.setActive(row.active());
            modifierGroupRepository.save(e);
        }
        return rows.size();
    }

    private int upsertModifierOptions(EdgeCatalogSnapshot snap) {
        List<ModifierOptionRow> rows = snap.modifierOptions() == null ? List.of() : snap.modifierOptions();
        for (ModifierOptionRow row : rows) {
            if (row.id() == null || row.groupId() == null) continue;
            ModifierGroup group = modifierGroupRepository.findById(row.groupId()).orElse(null);
            if (group == null) continue;
            ModifierOption e = modifierOptionRepository.findById(row.id()).orElseGet(ModifierOption::new);
            e.setId(row.id());
            e.setGroup(group);
            e.setName(row.name());
            e.setPriceDelta(row.priceDelta() == null ? BigDecimal.ZERO : row.priceDelta());
            e.setSortOrder(row.sortOrder());
            e.setActive(row.active());
            modifierOptionRepository.save(e);
        }
        return rows.size();
    }

    private int upsertModifierLinks(EdgeCatalogSnapshot snap) {
        List<ModifierLinkRow> rows = snap.modifierLinks() == null ? List.of() : snap.modifierLinks();
        int n = 0;
        for (ModifierLinkRow row : rows) {
            if (row.menuItemId() == null || row.groupId() == null) continue;
            MenuItemModifierLink.Key key = new MenuItemModifierLink.Key(row.menuItemId(), row.groupId());
            if (modifierLinkRepository.existsById(key)) continue;
            modifierLinkRepository.save(new MenuItemModifierLink(row.menuItemId(), row.groupId()));
            n++;
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
        for (RecipeRow row : rows) {
            if (row.id() == null || row.menuItemId() == null) continue;
            MenuItem menuItem = itemRepository.findById(row.menuItemId()).orElse(null);
            if (menuItem == null) continue;
            Recipe e = recipeRepository.findById(row.id()).orElseGet(Recipe::new);
            e.setId(row.id());
            e.setCompanyId(snap.companyId());
            e.setStoreId(snap.storeId());
            e.setMenuItem(menuItem);
            e.setOutputQty(row.outputQty() == null ? BigDecimal.ONE : row.outputQty());
            recipeRepository.save(e);
        }
        return rows.size();
    }

    private int upsertRecipeLines(EdgeCatalogSnapshot snap) {
        List<RecipeLineRow> rows = snap.recipeLines() == null ? List.of() : snap.recipeLines();
        for (RecipeLineRow row : rows) {
            if (row.id() == null || row.recipeId() == null) continue;
            Recipe recipe = recipeRepository.findById(row.recipeId()).orElse(null);
            if (recipe == null) continue;
            RecipeLine e = recipeLineRepository.findById(row.id()).orElseGet(RecipeLine::new);
            e.setId(row.id());
            e.setRecipe(recipe);
            e.setProductId(row.productId());
            e.setProductName(row.productName() == null ? "" : row.productName());
            e.setUnit(StringUtils.hasText(row.unit()) ? row.unit() : "kg");
            e.setQtyGross(row.qtyGross() == null ? BigDecimal.ZERO : row.qtyGross());
            e.setWastePercent(row.wastePercent() == null ? BigDecimal.ZERO : row.wastePercent());
            e.setQtyNet(row.qtyNet() == null ? BigDecimal.ZERO : row.qtyNet());
            e.setSortOrder(row.sortOrder());
            recipeLineRepository.save(e);
        }
        return rows.size();
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
