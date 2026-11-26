package com.pos.catalog.service.imports.support;

import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import org.springframework.util.StringUtils;

/**
 * Согласование saleType ↔ unitOfMeasure в preview импорта.
 * Сырой «pcs/dona» из файла не должен оставаться рядом с WEIGHT.
 */
public final class ProductImportUnitAlign {

    private ProductImportUnitAlign() {
    }

    /**
     * Явная штука в единице важнее колонки sale_type=WEIGHT (частый мусор в Excel).
     */
    public static SaleType alignSaleType(SaleType fromFile, String unitOfMeasure) {
        if (!isExplicitPieceUnit(unitOfMeasure)) {
            return fromFile;
        }
        if (fromFile == SaleType.WEIGHT) {
            return SaleType.PIECE;
        }
        return fromFile;
    }

    /** Подпись единицы в preview — канон из unitCode, не сырой конфликтный текст файла. */
    public static String displayUnit(String rawUnitOfMeasure, UnitCode unitCode) {
        if (unitCode != null) {
            return unitCode.displayLabel();
        }
        return StringUtils.hasText(rawUnitOfMeasure) ? rawUnitOfMeasure.trim() : "dona";
    }

    static boolean isExplicitPieceUnit(String unitOfMeasure) {
        if (!StringUtils.hasText(unitOfMeasure)) {
            return false;
        }
        String u = unitOfMeasure.trim().toLowerCase();
        if (u.equals("dona")
            || u.equals("шт")
            || u.equals("pcs")
            || u.equals("pc")
            || u.equals("piece")
            || u.equals("sh")) {
            return true;
        }
        UnitCode code = UnitCode.fromUnitOfMeasure(unitOfMeasure);
        return code == UnitCode.PCS
            && (u.contains("упак") || u.contains("pachka") || u.contains("pack"));
    }
}
