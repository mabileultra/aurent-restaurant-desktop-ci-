package com.pos.restaurant.menu.support;

import com.pos.restaurant.exception.ValidationException;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MenuItemImageLimitsTest {

    @Test
    void acceptsSmallPngDataUri() {
        String uri = "data:image/png;base64," + Base64.getEncoder().encodeToString(new byte[] {1, 2, 3});
        assertThatCode(() -> MenuItemImageLimits.assertDataUriIfPresent(uri)).doesNotThrowAnyException();
    }

    @Test
    void rejectsOversizedPayload() {
        byte[] huge = new byte[MenuItemImageLimits.MAX_BYTES + 1];
        String uri = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(huge);
        assertThatThrownBy(() -> MenuItemImageLimits.assertDataUriIfPresent(uri))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("too large");
    }

    @Test
    void rejectsDisallowedType() {
        String uri = "data:application/pdf;base64," + Base64.getEncoder().encodeToString(new byte[] {1});
        assertThatThrownBy(() -> MenuItemImageLimits.assertDataUriIfPresent(uri))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("not allowed");
    }

    @Test
    void ignoresNonDataUri() {
        assertThatCode(() -> MenuItemImageLimits.assertDataUriIfPresent("https://cdn.example/a.jpg"))
            .doesNotThrowAnyException();
    }
}
