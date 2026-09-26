package com.pos.restaurant.modifier.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.modifier.domain.ModifierGroupKind;
import com.pos.restaurant.modifier.dto.ModifierGroupResponse;
import com.pos.restaurant.modifier.dto.SaveModifierGroupRequest;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import com.pos.restaurant.modifier.repository.ModifierOptionRepository;
import com.pos.restaurant.modifier.support.ModifierGroupAssembler;
import com.pos.restaurant.modifier.support.ModifierGroupKindSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ModifierGroupUpdateHandler {

    private final ModifierGroupRepository groupRepository;
    private final ModifierOptionRepository optionRepository;
    private final FloorTenantSupport tenantSupport;
    private final ModifierGroupAssembler assembler;

    @Transactional
    public ModifierGroupResponse handle(UUID groupId, SaveModifierGroupRequest request) {
        ModifierGroup group = groupRepository.findByIdAndCompanyId(groupId, tenantSupport.requireCompanyId())
            .orElseThrow(() -> new NotFoundException("Modifier group not found: " + groupId));
        ModifierGroupKind kind = request.groupKind() == null
            ? ModifierGroupKindSupport.normalize(group.getGroupKind())
            : ModifierGroupKindSupport.normalize(request.groupKind());
        int minSelect = ModifierGroupKindSupport.minSelect(kind, request.minSelect());
        int maxSelect = ModifierGroupKindSupport.maxSelect(kind, request.maxSelect());
        if (minSelect > maxSelect) {
            throw new BusinessException("minSelect cannot be greater than maxSelect");
        }
        group.setName(request.name().trim());
        group.setGroupKind(kind);
        group.setMinSelect(minSelect);
        group.setMaxSelect(maxSelect);
        if (request.sortOrder() != null) {
            group.setSortOrder(request.sortOrder());
        }
        if (request.availableForAll() != null) {
            group.setAvailableForAll(request.availableForAll());
        }
        LogUtil.info(ModifierGroupUpdateHandler.class, "Modifier group updated: id={}, kind={}", groupId, kind);
        return assembler.toResponse(group, optionRepository.findByGroupIdOrderBySortOrderAscNameAsc(groupId));
    }
}
