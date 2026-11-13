package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DrugRegistryUnanimousTest {

    @Test
    void sameMakerAndCountryIsOneDrug() {
        var hit = DrugRegistryUnanimous.one(List.of(
            entry("Узхимфарм", "Узбекистан", false),
            entry("узхимфарм", "узбекистан", false)
        ));
        assertTrue(hit.isPresent());
        assertEquals("Узхимфарм", hit.get().getManufacturer());
    }

    @Test
    void differentCountryNeedsAChoice() {
        assertTrue(DrugRegistryUnanimous.one(List.of(
            entry("Узхимфарм", "Узбекистан", false),
            entry("Узхимфарм", "Индия", false)
        )).isEmpty());
    }

    private static DrugRegistryEntry entry(String manufacturer, String country, boolean prescription) {
        return DrugRegistryEntry.builder()
            .manufacturer(manufacturer)
            .country(country)
            .prescriptionRequired(prescription)
            .build();
    }
}
