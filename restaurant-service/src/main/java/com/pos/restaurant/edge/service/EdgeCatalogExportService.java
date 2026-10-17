package com.pos.restaurant.edge.service;

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
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.entity.ModifierOption;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import com.pos.restaurant.modifier.repository.ModifierOptionRepository;
import com.pos.restaurant.recipe.entity.Recipe;
import com.pos.restaurant.recipe.repository.RecipeLineRepository;
import com.pos.restaurant.recipe.repository.RecipeRepository;
import com.pos.restaurant.security.RestaurantTenantContext;
import com.pos.restaurant.settings.repository.RestaurantStoreSettingRepository;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.repository.RestaurantShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EdgeCatalogExportService {

    private final FloorHallRepository hallRepository;
    private final FloorTableRepository tableRepository;
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

    @Transactional(readOnly = true)
    public EdgeCatalogSnapshot export(Integer storeId, String companyLoginCode) {
        Integer companyId = RestaurantTenantContext.getCompanyId();
        if (companyId == null) {
            throw new BusinessException("Company context required");
        }
        if (storeId == null) {
            throw new BusinessException("storeId required");
        }

        List<HallRow> halls = hallRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId)
            .stream()
            .map(h -> new HallRow(h.getId(), h.getName(), h.getSortOrder(), h.isActive(), h.getServicePercent()))
            .toList();

        List<TableRow> tables = tableRepository
            .findByCompanyIdAndStoreIdOrderByHallAndCode(companyId, storeId)
            .stream()
            .map(t -> new TableRow(
                t.getId(),
                t.getHall().getId(),
                t.getCode(),
                t.getLabel(),
                t.getSeatCount(),
                t.getServicePercent(),
                t.getPosX(),
                t.getPosY(),
                t.getWidth(),
                t.getHeight(),
                t.getStatus() == null ? "FREE" : t.getStatus().name(),
                t.isActive()
            ))
            .toList();

        List<StationRow> stations = stationRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId)
            .stream()
            .map(s -> new StationRow(s.getId(), s.getCode(), s.getName(), s.getSortOrder(), s.isActive()))
            .toList();

        List<CategoryRow> categories = categoryRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId)
            .stream()
            .map(c -> new CategoryRow(
                c.getId(), c.getName(), c.getSortOrder(), c.isActive(),
                c.isAutoPrint(), c.getPrintPrinterName()
            ))
            .toList();

        List<ItemRow> items = itemRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId)
            .stream()
            .map(i -> new ItemRow(
                i.getId(),
                i.getItemType() == null ? "DISH" : i.getItemType().name(),
                i.getName(),
                i.getSku(),
                i.getPrice(),
                i.getTaxRate(),
                i.isActive(),
                i.isAvailable(),
                i.getStationId(),
                i.getCategory(),
                i.getMenuCategoryId(),
                i.getImageUrl(),
                i.getDescription(),
                i.getPrepMinutes(),
                i.getPortionGrams(),
                i.getPortionAmount(),
                i.getPortionUnit() == null ? null : i.getPortionUnit().name(),
                i.getPortionLabel(),
                i.getVariantGroupId(),
                i.getTags(),
                i.getIkpu(),
                i.getPackageCode(),
                i.getUnitOfMeasure(),
                i.getUnitMeasureCode(),
                i.getBarcode(),
                i.isMarkedProduct(),
                i.getSortOrder()
            ))
            .toList();

        List<ModifierGroup> groups = modifierGroupRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId);
        List<ModifierGroupRow> groupRows = groups.stream()
            .map(g -> new ModifierGroupRow(
                g.getId(), g.getName(),
                g.getGroupKind() == null ? "STANDARD" : g.getGroupKind().name(),
                g.getMinSelect(), g.getMaxSelect(), g.getSortOrder(),
                g.isAvailableForAll(), g.isActive()
            ))
            .toList();

        List<UUID> groupIds = groups.stream().map(ModifierGroup::getId).toList();
        List<ModifierOptionRow> optionRows = new ArrayList<>();
        for (UUID gid : groupIds) {
            for (ModifierOption o : modifierOptionRepository.findByGroupIdOrderBySortOrderAscNameAsc(gid)) {
                optionRows.add(new ModifierOptionRow(
                    o.getId(), gid, o.getName(), o.getPriceDelta(), o.getSortOrder(), o.isActive()
                ));
            }
        }

        List<UUID> itemIds = items.stream().map(ItemRow::id).toList();
        List<ModifierLinkRow> links = itemIds.isEmpty()
            ? List.of()
            : modifierLinkRepository.findByMenuItemIdIn(itemIds).stream()
                .map(l -> new ModifierLinkRow(l.getMenuItemId(), l.getGroupId()))
                .collect(Collectors.toList());

        StoreSettingRow setting = storeSettingRepository
            .findByCompanyIdAndStoreId(companyId, storeId)
            .map(s -> new StoreSettingRow(s.getId(), s.isKitchenBoardEnabled(), s.getPrintProfileJson()))
            .orElse(null);

        List<Recipe> recipes = recipeRepository.findByCompanyIdAndStoreId(companyId, storeId);
        List<RecipeRow> recipeRows = recipes.stream()
            .map(r -> new RecipeRow(
                r.getId(),
                r.getMenuItem() == null ? null : r.getMenuItem().getId(),
                r.getOutputQty()
            ))
            .toList();
        List<UUID> recipeIds = recipes.stream().map(Recipe::getId).toList();
        List<RecipeLineRow> recipeLineRows = recipeIds.isEmpty()
            ? List.of()
            : recipeLineRepository.findByRecipeIdIn(recipeIds).stream()
                .map(l -> new RecipeLineRow(
                    l.getId(),
                    l.getRecipe().getId(),
                    l.getProductId(),
                    l.getProductName(),
                    l.getUnit(),
                    l.getQtyGross(),
                    l.getWastePercent(),
                    l.getQtyNet(),
                    l.getSortOrder()
                ))
                .toList();

        ShiftRow openShift = shiftRepository
            .findByStoreIdAndStatus(storeId, RestaurantShiftStatus.OPEN)
            .filter(s -> companyId.equals(s.getCompanyId()))
            .map(s -> new ShiftRow(
                s.getId(),
                s.getStatus() == null ? "OPEN" : s.getStatus().name(),
                s.getOpenedByUserId(),
                s.getOpenedAt(),
                s.getOpeningCash(),
                s.getHandoverExpected(),
                s.getHandoverDiff(),
                s.getComment()
            ))
            .orElse(null);

        return new EdgeCatalogSnapshot(
            companyId,
            storeId,
            companyLoginCode,
            halls,
            tables,
            stations,
            categories,
            items,
            groupRows,
            optionRows,
            links,
            setting,
            recipeRows,
            recipeLineRows,
            openShift
        );
    }
}
