package com.pos.identity.service.access;

import com.pos.identity.dto.access.AdminModuleCatalogItem;
import com.pos.identity.security.AdminModule;
import com.pos.identity.security.PlatformAdminModule;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ModuleAccessCatalogTest {

    private final ModuleAccessCatalog catalog = new ModuleAccessCatalog();

    @Test
    void startsWithGrantablePlatformModulesThenTenantModules() {
        List<AdminModuleCatalogItem> items = catalog.allItems();
        List<String> platformKeys = PlatformAdminModule.grantable().stream()
            .map(PlatformAdminModule::key)
            .toList();
        assertEquals(platformKeys, items.subList(0, platformKeys.size()).stream().map(AdminModuleCatalogItem::id).toList());
        assertEquals("platform", items.get(0).group());
        assertEquals(platformKeys.size() + AdminModule.values().length, items.size());
    }

    @Test
    void doesNotExposeAccessOrSecurityAsGrantable() {
        Set<String> ids = catalog.allItems().stream().map(AdminModuleCatalogItem::id).collect(Collectors.toSet());
        assertFalse(ids.contains("platformAccess"));
        assertFalse(ids.contains("platformSecurity"));
        assertTrue(ids.contains("platformCompanies"));
        assertTrue(ids.contains("dashboard"));
    }
}
