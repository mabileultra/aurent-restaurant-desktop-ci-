package com.pos.restaurant.config;

import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.domain.MenuPortionUnit;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class RestaurantRedisValueSerializerTest {

    @Test
    void roundTripsMenuListWithRootTypeId() {
        RestaurantRedisValueSerializer serializer = new RestaurantRedisValueSerializer();
        MenuItemResponse item = new MenuItemResponse(
            UUID.fromString("1f9ab811-0f1d-4572-87b6-0ae8b04e5b5d"),
            66,
            MenuItemType.DISH,
            "Test",
            null,
            new BigDecimal("4000.00"),
            BigDecimal.ZERO,
            true,
            true,
            1,
            null,
            null,
            "CAT",
            null,
            null,
            null,
            null,
            null,
            MenuPortionUnit.PORTION,
            null,
            null,
            null,
            List.of(),
            null,
            null,
            null,
            null,
            null,
            false
        );
        List<MenuItemResponse> original = List.of(item);

        byte[] bytes = serializer.serialize(original);
        Object restored = serializer.deserialize(bytes);

        assertInstanceOf(List.class, restored);
        @SuppressWarnings("unchecked")
        List<Object> list = (List<Object>) restored;
        assertEquals(1, list.size());
        assertInstanceOf(MenuItemResponse.class, list.get(0));
        assertEquals("Test", ((MenuItemResponse) list.get(0)).name());
    }
}
