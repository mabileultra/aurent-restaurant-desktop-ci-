package com.pos.catalog.entity;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ProductAssignedIdTest {

    @Test
    void prePersistKeepsPreAssignedId() {
        UUID preset = UUID.fromString("0b49a442-e8f4-4d4c-8142-a133f0cb4a0d");
        Product product = new Product();
        product.setId(preset);

        product.prePersist();

        assertEquals(preset, product.getId());
    }

    @Test
    void prePersistAssignsWhenMissing() {
        Product product = new Product();

        product.prePersist();

        assertNotNull(product.getId());
    }
}
