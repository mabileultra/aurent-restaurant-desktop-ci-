package com.pos.restaurant.floor.support;

import java.math.BigDecimal;

public record FloorTileNumbers(BigDecimal subtotal, int linesCount) {

    public static FloorTileNumbers empty() {
        return new FloorTileNumbers(BigDecimal.ZERO, 0);
    }
}
