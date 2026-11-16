package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DrugRegistryNameMatchTest {

    @Test
    void stripsTrademarkAndMatchesPrefix() {
        assertEquals("тромбопол", DrugRegistryNameKey.of("Тромбопол®"));
        assertTrue(DrugRegistryNameMatch.matches("Тромбопол таб 75мг №60", "Тромбопол®"));
        assertFalse(DrugRegistryNameMatch.matches("Тромболитин таб", "Тромбопол"));
    }

    @Test
    void prefersLongerTradeName() {
        List<DrugRegistryEntry> group = DrugRegistryNameMatch.bestGroup(
            "Ибуклин актив таб №10",
            List.of(
                entry("ибуклин"),
                entry("ибуклин актив"),
                entry("ибуклин® актив")
            )
        );
        assertEquals(2, group.size());
        assertEquals("ибуклин актив", DrugRegistryNameKey.of(group.get(0).getNameKey()));
    }

    private static DrugRegistryEntry entry(String nameKey) {
        return DrugRegistryEntry.builder().nameKey(nameKey).tradeName(nameKey).build();
    }
}
