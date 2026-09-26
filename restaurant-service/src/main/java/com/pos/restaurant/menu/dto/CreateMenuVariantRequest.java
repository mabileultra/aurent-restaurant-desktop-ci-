package com.pos.restaurant.menu.dto;

import com.pos.restaurant.menu.domain.MenuPortionUnit;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Create a size sibling of an existing dish (own price / portion / recipe). */
public record CreateMenuVariantRequest(
    @NotNull @DecimalMin("0") BigDecimal price,
    @DecimalMin("0.001") BigDecimal portionAmount,
    MenuPortionUnit portionUnit,
    @Size(max = 40) String portionLabel,
    @Size(max = 64) String sku,
    @Size(max = 200) String name
) {}
