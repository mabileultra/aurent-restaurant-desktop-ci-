package com.pos.identity.service.access.support;

import com.pos.identity.dto.access.BulkResetModuleAccessRequest;
import com.pos.identity.dto.access.CopyModuleAccessRequest;
import com.pos.identity.dto.access.ModuleAccessHistoryItem;
import com.pos.identity.dto.access.ModuleAccessMutationResponse;
import com.pos.identity.dto.shared.PageResponse;
import com.pos.identity.entity.ModuleAccessHistory;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.exception.ResourceNotFoundException;
import com.pos.identity.repository.ModuleAccessHistoryRepository;
import com.pos.identity.security.IdentityTenantContext;
import com.pos.identity.service.access.ModuleAccessUserGate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ModuleAccessMutationSupport {

    private final ModuleAccessUserGate moduleAccessUserGate;
    private final ModuleAccessSnapshotSupport snapshotSupport;
    private final ModuleAccessHistoryWriter historyWriter;
    private final ModuleAccessHistoryRepository historyRepository;

    @Transactional
    public ModuleAccessMutationResponse copy(CopyModuleAccessRequest request) {
        User source = moduleAccessUserGate.requireConfigurable(request.sourceUserId());
        Map<String, Boolean> sourceModules = snapshotSupport.effectiveModules(source);
        boolean merge = "MERGE".equalsIgnoreCase(StringUtils.hasText(request.strategy()) ? request.strategy() : "REPLACE");
        String strategy = merge ? "MERGE" : "REPLACE";

        Set<UUID> targets = new LinkedHashSet<>(request.targetUserIds());
        targets.remove(source.getId());
        if (targets.isEmpty()) {
            throw new BadRequestException("targetUserIds required");
        }

        int affected = 0;
        for (UUID targetId : targets) {
            User target = moduleAccessUserGate.requireConfigurable(targetId);
            boolean beforeCustom = target.isModuleAccessCustom();
            Map<String, Boolean> before = snapshotSupport.effectiveModules(target);
            Map<String, Boolean> after = snapshotSupport.mergeOrReplace(target, sourceModules, merge);
            snapshotSupport.applyCustomModules(target, after);
            historyWriter.write("COPY", target, strategy, beforeCustom, true, before, after);
            affected++;
        }
        return new ModuleAccessMutationResponse(affected);
    }

    @Transactional
    public ModuleAccessMutationResponse bulkReset(BulkResetModuleAccessRequest request) {
        int affected = 0;
        for (UUID userId : new LinkedHashSet<>(request.userIds())) {
            User user = moduleAccessUserGate.requireConfigurable(userId);
            boolean beforeCustom = user.isModuleAccessCustom();
            Map<String, Boolean> before = snapshotSupport.effectiveModules(user);
            snapshotSupport.resetToTemplate(user);
            Map<String, Boolean> after = snapshotSupport.effectiveModules(user);
            historyWriter.write("BULK_RESET", user, null, beforeCustom, false, before, after);
            affected++;
        }
        return new ModuleAccessMutationResponse(affected);
    }

    @Transactional(readOnly = true)
    public PageResponse<ModuleAccessHistoryItem> history(UUID targetUserId, Pageable pageable) {
        Page<ModuleAccessHistory> page = targetUserId != null
            ? historyRepository.findByTargetUserIdOrderByCreatedAtDesc(targetUserId, pageable)
            : historyRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PageResponse.from(page.map(this::toItem));
    }

    @Transactional
    public ModuleAccessHistoryItem revert(UUID historyId) {
        ModuleAccessHistory row = historyRepository.findById(historyId)
            .orElseThrow(() -> new ResourceNotFoundException("History entry not found"));
        if (row.getRevertedAt() != null) {
            throw new BadRequestException("Already reverted");
        }
        User target = moduleAccessUserGate.requireConfigurable(row.getTargetUserId());
        boolean beforeCustom = target.isModuleAccessCustom();
        Map<String, Boolean> before = snapshotSupport.effectiveModules(target);
        Map<String, Boolean> restoreModules = ModuleAccessJson.fromJson(row.getBeforeModulesJson());

        if (row.isBeforeCustom()) {
            snapshotSupport.applyCustomModules(target, restoreModules);
        } else {
            snapshotSupport.resetToTemplate(target);
        }

        Map<String, Boolean> after = snapshotSupport.effectiveModules(target);
        row.setRevertedAt(Instant.now());
        row.setRevertedBy(IdentityTenantContext.userId());
        historyRepository.save(row);
        historyWriter.write(
            "REVERT",
            target,
            null,
            beforeCustom,
            target.isModuleAccessCustom(),
            before,
            after
        );
        return toItem(row);
    }

    private ModuleAccessHistoryItem toItem(ModuleAccessHistory row) {
        return new ModuleAccessHistoryItem(
            row.getId(),
            row.getCreatedAt(),
            row.getActorUserId(),
            row.getActorName(),
            row.getAction(),
            row.getTargetUserId(),
            row.getTargetUsername(),
            row.getTargetFullName(),
            row.getStrategy(),
            row.isBeforeCustom(),
            row.isAfterCustom(),
            ModuleAccessJson.fromJson(row.getBeforeModulesJson()),
            ModuleAccessJson.fromJson(row.getAfterModulesJson()),
            row.getRevertedAt(),
            row.getRevertedAt() == null && !"REVERT".equals(row.getAction())
        );
    }
}
