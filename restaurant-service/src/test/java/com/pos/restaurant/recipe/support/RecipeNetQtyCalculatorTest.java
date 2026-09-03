package com.pos.restaurant.recipe.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RecipeNetQtyCalculatorTest {

    private final RecipeNetQtyCalculator calculator = new RecipeNetQtyCalculator();

    @Test
    void subtractsWasteFromGross() {
        assertEquals(new BigDecimal("0.900"), calculator.netQty(new BigDecimal("1.000"), new BigDecimal("10")));
    }
}
