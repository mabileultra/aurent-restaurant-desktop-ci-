package com.pos.identity.service.access.support;

import com.pos.identity.dto.access.ModuleAccessMutationResponse;
import com.pos.identity.entity.User;
import com.pos.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * One-shot cleanup: users flagged as custom exceptions whose modules match the role template
 * are returned to template inheritance.
 */
@Component
@RequiredArgsConstructor
public class ModuleAccessFalseExceptionCleaner {

    private final UserRepository userRepository;
    private final ModuleAccessSnapshotSupport snapshotSupport;
    private final ModuleAccessHistoryWriter historyWriter;

    @Transactional
    public ModuleAccessMutationResponse normalize() {
        List<User> candidates = new ArrayList<>();
        candidates.addAll(userRepository.findTenantUsersForModuleAccess(null));
        candidates.addAll(userRepository.findPlatformOperatorsForModuleAccess());

        int affected = 0;
        for (User user : candidates) {
            if (!user.isModuleAccessCustom()) {
                continue;
            }
            Map<String, Boolean> custom = snapshotSupport.effectiveModules(user);
            user.setModuleAccessCustom(false);
            Map<String, Boolean> template = snapshotSupport.effectiveModules(user);
            user.setModuleAccessCustom(true);
            if (!custom.equals(template)) {
                continue;
            }
            boolean beforeCustom = true;
            Map<String, Boolean> before = custom;
            snapshotSupport.resetToTemplate(user);
            Map<String, Boolean> after = snapshotSupport.effectiveModules(user);
            historyWriter.write("BULK_RESET", user, "FALSE_EXCEPTION", beforeCustom, false, before, after);
            affected++;
        }
        return new ModuleAccessMutationResponse(affected);
    }
}
