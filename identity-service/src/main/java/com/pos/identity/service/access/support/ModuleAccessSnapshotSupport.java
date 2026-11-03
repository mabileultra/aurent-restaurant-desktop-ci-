package com.pos.identity.service.access.support;

import com.pos.identity.entity.User;
import com.pos.identity.entity.UserModuleAccess;
import com.pos.identity.entity.UserModuleAccessId;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.UserModuleAccessRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.access.ModuleAccessScopeResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ModuleAccessSnapshotSupport {

    private final UserModuleAccessRepository userModuleAccessRepository;
    private final UserRepository userRepository;
    private final ModuleAccessScopeResolver scopeResolver;

    public Map<String, Boolean> effectiveModules(User user) {
        List<String> scope = scopeResolver.keysFor(user);
        Map<String, Boolean> stored = storedAccess(user.getId());
        Map<String, Boolean> result = new LinkedHashMap<>();
        for (String key : scope) {
            if (!user.isModuleAccessCustom()) {
                result.put(key, scopeResolver.roleDefault(user, key));
            } else if (!stored.containsKey(key)) {
                result.put(key, scopeResolver.roleDefault(user, key));
            } else {
                result.put(key, Boolean.TRUE.equals(stored.get(key)));
            }
        }
        return result;
    }

    public Map<String, Boolean> storedAccess(UUID userId) {
        return userModuleAccessRepository.findByIdUserId(userId).stream()
            .collect(Collectors.toMap(UserModuleAccess::getModuleKey, UserModuleAccess::isAllowed, (a, b) -> b));
    }

    @Transactional
    public void applyCustomModules(User user, Map<String, Boolean> modules) {
        Map<String, Boolean> source = modules != null ? modules : Map.of();
        userModuleAccessRepository.deleteByUserId(user.getId());
        List<UserModuleAccess> rows = new ArrayList<>();
        boolean anyAllowed = false;
        for (String moduleKey : scopeResolver.keysFor(user)) {
            boolean allowed = Boolean.TRUE.equals(source.get(moduleKey));
            if (allowed) {
                anyAllowed = true;
            }
            rows.add(UserModuleAccess.builder()
                .id(new UserModuleAccessId(user.getId(), moduleKey))
                .user(user)
                .allowed(allowed)
                .build());
        }
        if (!anyAllowed) {
            throw new BadRequestException("Включите хотя бы один модуль");
        }
        userModuleAccessRepository.saveAll(rows);
        user.setModuleAccessCustom(true);
        bumpAccessVersion(user);
        userRepository.save(user);
    }

    @Transactional
    public void resetToTemplate(User user) {
        userModuleAccessRepository.deleteByUserId(user.getId());
        user.setModuleAccessCustom(false);
        bumpAccessVersion(user);
        userRepository.save(user);
    }

    @Transactional
    public void bumpAccessVersion(User user) {
        user.setAccessVersion(user.getAccessVersion() + 1);
    }

    /** MERGE: OR with existing effective; REPLACE: overwrite with source map (scoped). */
    public Map<String, Boolean> mergeOrReplace(
        User target,
        Map<String, Boolean> sourceModules,
        boolean merge
    ) {
        Map<String, Boolean> result = new LinkedHashMap<>();
        Map<String, Boolean> current = effectiveModules(target);
        for (String key : scopeResolver.keysFor(target)) {
            boolean fromSource = Boolean.TRUE.equals(sourceModules.get(key));
            if (merge) {
                result.put(key, Boolean.TRUE.equals(current.get(key)) || fromSource);
            } else {
                result.put(key, fromSource);
            }
        }
        return result;
    }
}
