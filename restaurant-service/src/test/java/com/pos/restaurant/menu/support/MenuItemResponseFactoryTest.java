package com.pos.restaurant.menu.support;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class MenuItemResponseFactoryTest {

    @Test
    void replacesInlineDataUriWithLazyImageRef() {
        UUID id = UUID.fromString("11111111-1111-1111-1111-111111111111");
        assertThat(MenuItemResponseFactory.listSafeImageUrl(id, null)).isNull();
        assertThat(MenuItemResponseFactory.listSafeImageUrl(id, "")).isNull();
        assertThat(MenuItemResponseFactory.listSafeImageUrl(id, "data:image/jpeg;base64,AAAA"))
            .isEqualTo(MenuItemImageRef.forItem(id));
        assertThat(MenuItemResponseFactory.listSafeImageUrl(id, "https://cdn.example/p.jpg"))
            .isEqualTo("https://cdn.example/p.jpg");
    }
}
