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
        UUID actorId = IdentityTenantContext.userId();
        String actorName = null;
        if (actorId != null) {
            actorName = userRepository.findById(actorId)
                .map(User::getFullName)
                .orElse(IdentityTenantContext.role());
        }
        ModuleAccessHistory row = ModuleAccessHistory.builder()
            .actorUserId(actorId)
            .actorName(actorName)
            .action(action)
            .targetUserId(target.getId())
            .targetUsername(target.getUsername())
            .targetFullName(target.getFullName())
            .strategy(strategy)
            .beforeCustom(beforeCustom)
            .afterCustom(afterCustom)
            .beforeModulesJson(ModuleAccessJson.toJson(beforeModules))
            .afterModulesJson(ModuleAccessJson.toJson(afterModules))
            .build();
        return historyRepository.save(row);
    }
}
