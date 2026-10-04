package com.pos.restaurant.settings.support;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StorePrintProfileDefaultsTest {

    @Test
    void factoryKeepsCancelHeaderAndItemsVisible() {
        Map<String, Object> profile = StorePrintProfileDefaults.factory();
        @SuppressWarnings("unchecked")
        Map<String, Object> cancel = (Map<String, Object>) ((Map<?, ?>) profile.get("slips")).get("CANCEL");
        @SuppressWarnings("unchecked")
        Map<String, Object> fields = (Map<String, Object>) cancel.get("fields");
        @SuppressWarnings("unchecked")
        Map<String, Object> header = (Map<String, Object>) fields.get("headerTitle");
        @SuppressWarnings("unchecked")
        Map<String, Object> items = (Map<String, Object>) fields.get("items");
        @SuppressWarnings("unchecked")
        Map<String, Object> logo = (Map<String, Object>) fields.get("logo");

        assertTrue((Boolean) header.get("on"));
        assertEquals("lg", header.get("size"));
        assertTrue((Boolean) items.get("on"));
        assertTrue((Boolean) items.get("bold"));
        assertFalse((Boolean) logo.get("on"));
        assertEquals("monospace", profile.get("defaultFont"));
    }

    @Test
    void mergeClampsLogoHeightAndAcceptsTimesFont() {
        Map<String, Object> merged = StorePrintProfileDefaults.merge(Map.of(
            "logoMaxHeightMm", 99,
            "defaultFont", "times",
            "storeName", "Rayhon"
        ));
        assertEquals(40, merged.get("logoMaxHeightMm"));
        assertEquals("times", merged.get("defaultFont"));
        assertEquals("Rayhon", merged.get("storeName"));
    }
}
