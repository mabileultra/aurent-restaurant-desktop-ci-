package com.pos.restaurant.recipe.support;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class RecipeNetQtyCalculator {

    public BigDecimal netQty(BigDecimal qtyGross, BigDecimal wastePercent) {
        BigDecimal gross = qtyGross == null ? BigDecimal.ZERO : qtyGross;
        BigDecimal waste = wastePercent == null ? BigDecimal.ZERO : wastePercent;
        BigDecimal factor = BigDecimal.ONE.subtract(waste.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP));
        if (factor.signum() < 0) {
            factor = BigDecimal.ZERO;
        }
        return gross.multiply(factor).setScale(3, RoundingMode.HALF_UP);
    }
}
