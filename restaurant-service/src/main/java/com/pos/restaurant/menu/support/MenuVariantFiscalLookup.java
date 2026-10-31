package com.pos.restaurant.menu.support;

import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Resolves Tasnif fields for an order line: own ИКПУ, else a sibling in the same variant group.
 */
@Component
@RequiredArgsConstructor
public class MenuVariantFiscalLookup {

    private final MenuItemRepository itemRepository;

    public record FiscalFields(
        String ikpu,
        String packageCode,
        String unitOfMeasure,
        String unitMeasureCode,
        String barcode,
        boolean markedProduct
    ) {
        public static FiscalFields empty() {
            return new FiscalFields(null, null, null, null, null, false);
        }

        public static FiscalFields from(MenuItem item) {
            if (item == null) {
                return empty();
            }
            return new FiscalFields(
                blankToNull(item.getIkpu()),
                blankToNull(item.getPackageCode()),
                blankToNull(item.getUnitOfMeasure()),
                blankToNull(item.getUnitMeasureCode()),
                blankToNull(item.getBarcode()),
                item.isMarkedProduct()
            );
        }
    }

    public Map<UUID, FiscalFields> donorsByGroup(Integer companyId, Collection<MenuItem> menus) {
        if (companyId == null || menus == null || menus.isEmpty()) {
            return Map.of();
        }
        Set<UUID> needGroups = new HashSet<>();
        for (MenuItem menu : menus) {
            if (menu == null || menu.getVariantGroupId() == null) {
                continue;
            }
            if (blankToNull(menu.getIkpu()) != null) {
                continue;
            }
            needGroups.add(menu.getVariantGroupId());
        }
        if (needGroups.isEmpty()) {
            return Map.of();
        }
        Map<UUID, FiscalFields> donors = new HashMap<>();
        List<MenuItem> siblings = itemRepository.findByCompanyIdAndVariantGroupIdIn(companyId, needGroups);
        for (MenuItem sibling : siblings) {
            if (blankToNull(sibling.getIkpu()) == null) {
                continue;
            }
            donors.putIfAbsent(sibling.getVariantGroupId(), FiscalFields.from(sibling));
        }
        return donors;
    }

    public FiscalFields resolve(MenuItem menu, Map<UUID, FiscalFields> donorsByGroup) {
        if (menu == null) {
            return FiscalFields.empty();
        }
        FiscalFields own = FiscalFields.from(menu);
        if (own.ikpu() != null) {
            return own;
        }
        UUID groupId = menu.getVariantGroupId();
        if (groupId == null || donorsByGroup == null) {
            return own;
        }
        FiscalFields donor = donorsByGroup.get(groupId);
        return donor != null ? donor : own;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
