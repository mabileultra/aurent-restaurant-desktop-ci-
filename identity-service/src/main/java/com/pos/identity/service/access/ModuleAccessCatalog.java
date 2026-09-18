package com.pos.identity.service.access;

import com.pos.identity.dto.access.AdminModuleCatalogItem;
import com.pos.identity.security.AdminModule;
import com.pos.identity.security.PlatformAdminModule;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class ModuleAccessCatalog {

    public List<AdminModuleCatalogItem> allItems() {
        List<AdminModuleCatalogItem> items = new ArrayList<>();
        for (PlatformAdminModule module : PlatformAdminModule.grantable()) {
            items.add(new AdminModuleCatalogItem(module.key(), module.group()));
        }
        Arrays.stream(AdminModule.values())
            .map(m -> new AdminModuleCatalogItem(m.key(), m.group()))
            .forEach(items::add);
        return items;
    }
}
