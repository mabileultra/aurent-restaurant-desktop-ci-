package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;

import java.util.List;

/** Hall→cloud catalog push: structure only (no live floor / payments). */
public final class CatalogStructureSlice {

    private CatalogStructureSlice() {}

    public static EdgeCatalogSnapshot of(EdgeCatalogSnapshot full) {
        if (full == null) return null;
        return new EdgeCatalogSnapshot(
            full.companyId(),
            full.storeId(),
            full.companyLoginCode(),
            full.halls() == null ? List.of() : full.halls(),
            full.tables() == null ? List.of() : full.tables(),
            full.stations() == null ? List.of() : full.stations(),
            full.categories() == null ? List.of() : full.categories(),
            full.items() == null ? List.of() : full.items(),
            full.modifierGroups() == null ? List.of() : full.modifierGroups(),
            full.modifierOptions() == null ? List.of() : full.modifierOptions(),
            full.modifierLinks() == null ? List.of() : full.modifierLinks(),
            full.storeSetting(),
            full.recipes() == null ? List.of() : full.recipes(),
            full.recipeLines() == null ? List.of() : full.recipeLines(),
            null,
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            full.floorRevision()
        );
    }
}
