package com.pos.restaurant.edge.dto.catalog;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Full store catalog for one-time offline bootstrap (preserve cloud ids). */
public record EdgeCatalogSnapshot(
    Integer companyId,
    Integer storeId,
    String companyLoginCode,
    List<HallRow> halls,
    List<TableRow> tables,
    List<StationRow> stations,
    List<CategoryRow> categories,
    List<ItemRow> items,
    List<ModifierGroupRow> modifierGroups,
    List<ModifierOptionRow> modifierOptions,
    List<ModifierLinkRow> modifierLinks,
    StoreSettingRow storeSetting,
    List<RecipeRow> recipes,
    List<RecipeLineRow> recipeLines,
    ShiftRow openShift
) {
    public record HallRow(
        Integer id,
        String name,
        int sortOrder,
        boolean active,
        BigDecimal servicePercent
    ) {}

    public record TableRow(
        Integer id,
        Integer hallId,
        String code,
        String label,
        int seatCount,
        BigDecimal servicePercent,
        int posX,
        int posY,
        int width,
        int height,
        String status,
        boolean active
    ) {}

    public record StationRow(
        UUID id,
        String code,
        String name,
        int sortOrder,
        boolean active
    ) {}

    public record CategoryRow(
        UUID id,
        String name,
        int sortOrder,
        boolean active,
        boolean autoPrint,
        String printPrinterName
    ) {}

    public record ItemRow(
        UUID id,
        String itemType,
        String name,
        String sku,
        BigDecimal price,
        BigDecimal taxRate,
        boolean active,
        boolean available,
        UUID stationId,
        String category,
        UUID menuCategoryId,
        String imageUrl,
        String description,
        Integer prepMinutes,
        Integer portionGrams,
        BigDecimal portionAmount,
        String portionUnit,
        String portionLabel,
        UUID variantGroupId,
        String tags,
        String ikpu,
        String packageCode,
        String unitOfMeasure,
        String unitMeasureCode,
        String barcode,
        boolean markedProduct,
        int sortOrder
    ) {}

    public record ModifierGroupRow(
        UUID id,
        String name,
        String groupKind,
        int minSelect,
        int maxSelect,
        int sortOrder,
        boolean availableForAll,
        boolean active
    ) {}

    public record ModifierOptionRow(
        UUID id,
        UUID groupId,
        String name,
        BigDecimal priceDelta,
        int sortOrder,
        boolean active
    ) {}

    public record ModifierLinkRow(UUID menuItemId, UUID groupId) {}

    public record StoreSettingRow(
        UUID id,
        boolean kitchenBoardEnabled,
        String printProfileJson
    ) {}

    public record RecipeRow(
        UUID id,
        UUID menuItemId,
        BigDecimal outputQty
    ) {}

    public record RecipeLineRow(
        UUID id,
        UUID recipeId,
        UUID productId,
        String productName,
        String unit,
        BigDecimal qtyGross,
        BigDecimal wastePercent,
        BigDecimal qtyNet,
        int sortOrder
    ) {}

    public record ShiftRow(
        UUID id,
        String status,
        UUID openedByUserId,
        Instant openedAt,
        BigDecimal openingCash,
        BigDecimal handoverExpected,
        BigDecimal handoverDiff,
        String comment
    ) {}
}
