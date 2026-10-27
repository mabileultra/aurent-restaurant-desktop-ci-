package com.pos.restaurant.menu.support;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MenuItemResponseFactoryTest {

    @Test
    void stripsInlineDataUriPhotosFromListPayload() {
        assertThat(MenuItemResponseFactory.listSafeImageUrl(null)).isNull();
        assertThat(MenuItemResponseFactory.listSafeImageUrl("")).isNull();
        assertThat(MenuItemResponseFactory.listSafeImageUrl("data:image/jpeg;base64,AAAA")).isNull();
        assertThat(MenuItemResponseFactory.listSafeImageUrl("DATA:image/png;base64,BB")).isNull();
        assertThat(MenuItemResponseFactory.listSafeImageUrl("https://cdn.example/p.jpg"))
            .isEqualTo("https://cdn.example/p.jpg");
    }
}
