package com.pos.pharmacy.util;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.domain.ProductQuantityRules;
import com.pos.pharmacy.domain.SaleType;
import com.pos.pharmacy.domain.UnitCode;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCatalogErrors;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class QuantityValidator {

    private QuantityValidator() {}

    public static void validate(Product product, BigDecimal rawQuantity) {
        validate(ProductQuantityRules.from(product), rawQuantity);
    }

    public static void validate(ProductQuantityRules rules, BigDecimal rawQuantity) {
        SaleType saleType = rules.saleType() != null ? rules.saleType() : SaleType.PIECE;
        BigDecimal q = normalizeForProduct(rules, rawQuantity);
        if (q.signum() <= 0) {
            throw PharmacyErrors.of(PharmacyCatalogErrors.PHARM_QTY_MUST_BE_POSITIVE);
        }
        if (!rules.allowFraction() && !matchesScale(q, 0)) {
            throw PharmacyErrors.of(PharmacyCatalogErrors.PHARM_QTY_MUST_BE_INTEGER);
        }
        if (!matchesScale(q, rules.quantityScale())) {
            throw PharmacyErrors.of(
                PharmacyCatalogErrors.PHARM_QTY_SCALE,
                "Количество допускает не более " + rules.quantityScale() + " знаков после запятой"
            );
        }
        if (saleType == SaleType.WEIGHT) {
            validateWeightMinimum(rules.unitCode(), q);
        } else if (!rules.allowFraction() && !matchesScale(q, 0)) {
            throw PharmacyErrors.of(
                saleType == SaleType.SERVICE
                    ? PharmacyCatalogErrors.PHARM_QTY_SERVICE_INTEGER
                    : PharmacyCatalogErrors.PHARM_QTY_PIECE_INTEGER
            );
        }
    }

    public static BigDecimal normalizeForProduct(ProductQuantityRules rules, BigDecimal quantity) {
        return QuantityUtil.normalize(quantity).setScale(rules.quantityScale(), RoundingMode.HALF_UP);
    }

    public static BigDecimal normalizeForProduct(Product product, BigDecimal quantity) {
        return normalizeForProduct(ProductQuantityRules.from(product), quantity);
    }

    private static void validateWeightMinimum(UnitCode unitCode, BigDecimal q) {
        UnitCode unit = unitCode != null ? unitCode : UnitCode.KG;
        BigDecimal min = UnitCode.fallbackMinQuantity(unit);
        if (q.compareTo(min) < 0) {
            throw PharmacyErrors.of(
                PharmacyCatalogErrors.PHARM_QTY_MIN,
                "Минимальное количество: " + min + " " + unit.displayLabel()
            );
        }
    }

    static boolean matchesScale(BigDecimal q, int scale) {
        return q.setScale(scale, RoundingMode.HALF_UP).compareTo(q) == 0;
    }
}
