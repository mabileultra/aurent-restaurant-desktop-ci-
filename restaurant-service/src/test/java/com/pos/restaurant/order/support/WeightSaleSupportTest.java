package com.pos.restaurant.order.support;

import com.pos.restaurant.menu.domain.MenuPortionUnit;
import com.pos.restaurant.menu.entity.MenuItem;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class WeightSaleSupportTest {

    @Test
    void kitchenNoteUsesPrintedQtyForWeightSold() {
        MenuItem item = MenuItem.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(2)
            .name("Lagman")
            .portionUnit(MenuPortionUnit.KG)
            .portionAmount(BigDecimal.ONE)
            .price(new BigDecimal("12000"))
            .build();

        assertEquals("1 кг", WeightSaleSupport.kitchenNote(item, "2 кг", BigDecimal.ONE));
        assertEquals("200 г", WeightSaleSupport.kitchenNote(item, "1 кг", new BigDecimal("0.2")));
    }

    @Test
    void kitchenNoteKeepsOrderNoteForPieceDishes() {
        MenuItem item = MenuItem.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(2)
            .name("Kola")
            .portionUnit(MenuPortionUnit.PCS)
            .portionAmount(BigDecimal.ONE)
            .price(new BigDecimal("12000"))
            .build();

        assertEquals("без льда", WeightSaleSupport.kitchenNote(item, "без льда", BigDecimal.ONE));
        assertNull(WeightSaleSupport.kitchenNote(item, null, BigDecimal.ONE));
    }
}
