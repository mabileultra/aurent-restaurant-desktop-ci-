package com.pos.identity.security;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlatformAdminModuleTest {

    @Test
    void grantableKeysAreUniqueAndPlatformGrouped() {
        Set<String> keys = new HashSet<>();
        for (PlatformAdminModule module : PlatformAdminModule.grantable()) {
            assertEquals("platform", module.group());
            assertTrue(keys.add(module.key()));
        }
        assertEquals(PlatformAdminModule.values().length, keys.size());
        assertFalse(PlatformAdminModule.isKey("dashboard"));
        assertTrue(PlatformAdminModule.isKey("platformCompanies"));
        assertTrue(PlatformAdminModule.isKey("platformAccess"));
        assertFalse(PlatformAdminModule.isKey("platformSecurity"));
        assertFalse(PlatformAdminModule.isKey("dashboard"));
    }
}
