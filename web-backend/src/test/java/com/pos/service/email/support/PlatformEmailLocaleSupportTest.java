package com.pos.service.email.support;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlatformEmailLocaleSupportTest {

    private final PlatformEmailLocaleSupport support = new PlatformEmailLocaleSupport();

    @Test
    void defaultsToUzbek() {
        assertEquals("uz", support.normalize(null));
        assertEquals("uz", support.normalize(" "));
        Map<String, String> vars = new HashMap<>();
        support.putChrome(vars, null);
        assertEquals("Assalomu alaykum,", vars.get("greeting"));
        assertTrue(vars.get("footerNote").contains("avtomatik"));
    }

    @Test
    void russianChrome() {
        Map<String, String> vars = new HashMap<>();
        support.putChrome(vars, "ru");
        assertEquals("Здравствуйте,", vars.get("greeting"));
        assertEquals("ru", vars.get("lang"));
    }
}
