package com.pos.restaurant.modifier.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.modifier.domain.ModifierGroupKind;
import com.pos.restaurant.modifier.dto.ModifierGroupResponse;
import com.pos.restaurant.modifier.dto.SaveModifierGroupRequest;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import com.pos.restaurant.modifier.support.ModifierGroupAssembler;
import com.pos.restaurant.modifier.support.ModifierGroupKindSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ModifierGroupCreateHandler {

    private final ModifierGroupRepository groupRepository;
    private final FloorTenantSupport tenantSupport;
    private final ModifierGroupAssembler assembler;

    @Transactional
    public ModifierGroupResponse handle(Integer storeId, SaveModifierGroupRequest request) {
        ModifierGroupKind kind = ModifierGroupKindSupport.normalize(request.groupKind());
        int minSelect = ModifierGroupKindSupport.minSelect(kind, request.minSelect());
        int maxSelect = ModifierGroupKindSupport.maxSelect(kind, request.maxSelect());
        if (minSelect > maxSelect) {
            throw new BusinessException("minSelect cannot be greater than maxSelect");
        }
        ModifierGroup saved = groupRepository.save(ModifierGroup.builder()
            .companyId(tenantSupport.requireCompanyId())
            .storeId(storeId)
            .name(request.name().trim())
            .groupKind(kind)
            .minSelect(minSelect)
            .maxSelect(maxSelect)
            .sortOrder(request.sortOrder() == null ? (kind == ModifierGroupKind.SIZE ? 10 : 100) : request.sortOrder())
            .availableForAll(Boolean.TRUE.equals(request.availableForAll()))
            .active(true)
            .build());
        LogUtil.info(ModifierGroupCreateHandler.class, "Modifier group created: id={}, kind={}", saved.getId(), kind);
        return assembler.toResponse(saved, List.of());
    }
}
