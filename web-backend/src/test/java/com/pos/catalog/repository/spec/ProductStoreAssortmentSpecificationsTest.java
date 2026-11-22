package com.pos.catalog.repository.spec;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;

import static org.assertj.core.api.Assertions.assertThat;

class ProductStoreAssortmentSpecificationsTest {

    @Test
    void nullStoreIdIsNoOpConjunction() {
        Specification<?> spec = ProductStoreAssortmentSpecifications.presentAtStore(null);
        assertThat(spec).isNotNull();
    }

    @Test
    void nonNullStoreIdBuildsSpec() {
        Specification<?> spec = ProductStoreAssortmentSpecifications.presentAtStore(42);
        assertThat(spec).isNotNull();
    }
}
