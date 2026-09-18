package com.pos.identity.security;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Разделы супер-админки, которые можно выдать PLATFORM_ADMIN.
 * Безопасность (super-admins) остаётся только у SUPER_ADMIN.
 */
public enum PlatformAdminModule {
    COMPANIES("platformCompanies", "platform"),
    STORES("platformStores", "platform"),
    USERS("platformUsers", "platform"),
    ACCESS("platformAccess", "platform"),
    BUSINESS_TYPES("platformBusinessTypes", "platform"),
    REFERENCE_BOOKS("platformReferenceBooks", "platform"),
    LEADS("platformLeads", "platform"),
    BILLING("platformBilling", "platform"),
    MONITORING("platformMonitoring", "platform"),
    EMAIL("platformEmail", "platform"),
    DESKTOP_NOTIFICATIONS("platformDesktopNotifications", "platform");

    private final String key;
    private final String group;

    PlatformAdminModule(String key, String group) {
        this.key = key;
        this.group = group;
    }

    public String key() {
        return key;
    }

    public String group() {
        return group;
    }

    public static List<PlatformAdminModule> grantable() {
        return Arrays.asList(values());
    }

    public static Set<String> keys() {
        return Arrays.stream(values()).map(PlatformAdminModule::key).collect(Collectors.toSet());
    }

    public static boolean isKey(String moduleKey) {
        return keys().contains(moduleKey);
    }
}
