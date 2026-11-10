package com.pos.identity.service.access.support;

import com.pos.identity.entity.ModuleAccessHistory;
import com.pos.identity.entity.User;
import com.pos.identity.repository.ModuleAccessHistoryRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.IdentityTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ModuleAccessHistoryWriter {

    private final ModuleAccessHistoryRepository historyRepository;
    private final UserRepository userRepository;

    public ModuleAccessHistory write(
        String action,
        User target,
        String strategy,
        boolean beforeCustom,
        boolean afterCustom,
        Map<String, Boolean> beforeModules,
        Map<String, Boolean> afterModules
    ) {
        return historyRepository.save(baseBuilder(action, strategy, beforeCustom, afterCustom, beforeModules, afterModules)
            .targetUserId(target.getId())
            .targetUsername(target.getUsername())
            .targetFullName(target.getFullName())
            .build());
    }

    public ModuleAccessHistory writeTemplate(
        String businessType,
        String roleName,
        Map<String, Boolean> beforeModules,
        Map<String, Boolean> afterModules
    ) {
        return historyRepository.save(baseBuilder(
            "TEMPLATE",
            null,
            false,
            false,
            beforeModules,
            afterModules
        )
            .businessType(businessType)
            .roleName(roleName)
            .targetFullName(businessType + " / " + roleName)
            .build());
    }

    private ModuleAccessHistory.ModuleAccessHistoryBuilder baseBuilder(
        String action,
        String strategy,
        boolean beforeCustom,
        boolean afterCustom,
        Map<String, Boolean> beforeModules,
        Map<String, Boolean> afterModules
    ) {
        UUID actorId = IdentityTenantContext.userId();
        String actorName = null;
        if (actorId != null) {
            actorName = userRepository.findById(actorId)
                .map(User::getFullName)
                .orElse(IdentityTenantContext.role());
        }
        return ModuleAccessHistory.builder()
            .actorUserId(actorId)
            .actorName(actorName)
            .action(action)
            .strategy(strategy)
            .beforeCustom(beforeCustom)
            .afterCustom(afterCustom)
            .beforeModulesJson(ModuleAccessJson.toJson(beforeModules))
            .afterModulesJson(ModuleAccessJson.toJson(afterModules));
    }
}
