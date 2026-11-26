package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.catalog.service.imports.ProductImportSupport;
import com.pos.catalog.service.product.ProductQuantityRulesResolver;
import com.pos.domain.ProductQuantityRules;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import org.springframework.util.StringUtils;

/**
 * Единица/тип продажи при импорте: правка из confirm важнее файла.
 */
public final class ProductImportUnitRules {

    private ProductImportUnitRules() {
    }

    public static ProductQuantityRules resolve(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts
    ) {
        SaleType requestedSaleType = null;
        UnitCode requestedUnitCode = null;
        String unitOfMeasure = null;
        boolean unitCodeOverridden = false;

        if (rowOpts != null) {
            requestedSaleType = ProductImportSupport.parseImportSaleType(rowOpts.saleType());
            requestedUnitCode = parseUnitCode(rowOpts.unitCode());
            unitCodeOverridden = requestedUnitCode != null;
            if (StringUtils.hasText(rowOpts.unitOfMeasure())) {
                unitOfMeasure = rowOpts.unitOfMeasure().trim();
            }
        }
        if (unitCodeOverridden && requestedSaleType == null) {
            requestedSaleType = saleTypeForUnit(requestedUnitCode);
        }
        if (unitCodeOverridden && !StringUtils.hasText(unitOfMeasure)) {
            unitOfMeasure = requestedUnitCode.displayLabel();
        }
        if (!StringUtils.hasText(unitOfMeasure) && row != null && StringUtils.hasText(row.unitOfMeasure())) {
            unitOfMeasure = row.unitOfMeasure().trim();
        }
        if (!StringUtils.hasText(unitOfMeasure)) {
            unitOfMeasure = "dona";
        }
        if (requestedSaleType == null && row != null) {
            requestedSaleType = ProductImportSupport.parseImportSaleType(row.importSaleType());
        }
        return ProductQuantityRulesResolver.resolve(
            requestedSaleType,
            requestedUnitCode,
            null,
            null,
            unitOfMeasure
        );
    }

    public static String resolveUnitOfMeasureLabel(
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts,
        ProductQuantityRules rules
    ) {
        if (rowOpts != null && StringUtils.hasText(rowOpts.unitOfMeasure())) {
            return rowOpts.unitOfMeasure().trim();
        }
        if (rowOpts != null && StringUtils.hasText(rowOpts.unitCode())) {
            return rules.unitCode() != null ? rules.unitCode().displayLabel() : "pcs";
        }
        if (row != null && StringUtils.hasText(row.unitOfMeasure())) {
            return row.unitOfMeasure().trim();
        }
        return rules.unitCode() != null ? rules.unitCode().displayLabel() : "dona";
    }

    static SaleType saleTypeForUnit(UnitCode unitCode) {
        if (unitCode == null) {
            return SaleType.PIECE;
        }
        return switch (unitCode) {
            case PCS, PAIR, SET, PACK, BOX, ROLL, SHEET, HOUR, DAY -> SaleType.PIECE;
            default -> SaleType.WEIGHT;
        };
    }

    private static UnitCode parseUnitCode(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return UnitCode.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return UnitCode.fromUnitOfMeasure(raw);
        }
    }
}
