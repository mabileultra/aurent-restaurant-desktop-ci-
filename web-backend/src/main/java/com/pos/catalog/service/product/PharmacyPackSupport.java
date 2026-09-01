package com.pos.catalog.service.product;

import com.pos.domain.ProductQuantityRules;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import com.pos.catalog.entity.Product;
import com.pos.util.QuantityUtil;

import java.util.Map;
import java.util.OptionalInt;

/**
 * Продажа поштучно из упаковки: остаток на складе в упаковках, в чеке — дробное списание.
 */
public final class PharmacyPackSupport {

    public static final String ATTR_UNITS_IN_PACK = "units_in_pack";

    private PharmacyPackSupport() {
    }

    public static OptionalInt unitsInPack(Map<String, String> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return OptionalInt.empty();
        }
        String raw = attributes.get(ATTR_UNITS_IN_PACK);
        if (raw == null || raw.isBlank()) {
            return OptionalInt.empty();
        }
        try {
            String normalized = raw.trim().replace(',', '.');
            double value = Double.parseDouble(normalized);
            int units = (int) Math.round(value);
            if (units <= 1) {
                return OptionalInt.empty();
            }
            return OptionalInt.of(units);
        } catch (NumberFormatException ignored) {
            return OptionalInt.empty();
        }
    }

    public static ProductQuantityRules checkoutQuantityRules(Product product, Map<String, String> attributes) {
        if (unitsInPack(attributes).isPresent()) {
            SaleType saleType = product.getSaleType() != null ? product.getSaleType() : SaleType.PIECE;
            UnitCode unitCode = product.getUnitCode() != null ? product.getUnitCode() : UnitCode.PCS;
            return new ProductQuantityRules(saleType, unitCode, QuantityUtil.SCALE, true);
        }
        return ProductQuantityRules.from(product);
    }
}
