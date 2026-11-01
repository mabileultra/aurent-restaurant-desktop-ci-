package com.pos.identity.service.access.support;

import com.pos.identity.entity.RoleModuleTemplate;
import com.pos.identity.repository.RoleModuleTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Cached-per-request lookup of saved role templates (businessType + role → module flags).
 */
@Component
@RequiredArgsConstructor
public class RoleTemplateLookup {

    private final RoleModuleTemplateRepository roleModuleTemplateRepository;

    public Optional<Map<String, Boolean>> findModules(String businessType, String roleName) {
        if (!StringUtils.hasText(businessType) || !StringUtils.hasText(roleName)) {
            return Optional.empty();
        }
        String bt = businessType.trim().toUpperCase(Locale.ROOT);
        String role = roleName.trim().toUpperCase(Locale.ROOT);
        if (!roleModuleTemplateRepository.existsByIdBusinessTypeAndIdRoleName(bt, role)) {
            return Optional.empty();
        }
        Map<String, Boolean> modules = new HashMap<>();
        for (RoleModuleTemplate row : roleModuleTemplateRepository.findByIdBusinessTypeAndIdRoleName(bt, role)) {
            modules.put(row.getId().getModuleKey(), row.isAllowed());
        }
        return Optional.of(modules);
    }

    public boolean isAllowed(String businessType, String roleName, String moduleKey, boolean enumDefault) {
        return findModules(businessType, roleName)
            .map(map -> Boolean.TRUE.equals(map.get(moduleKey)))
            .orElse(enumDefault);
    }
}
