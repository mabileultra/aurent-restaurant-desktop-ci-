package com.pos.restaurant.modifier.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.modifier.dto.ModifierOptionResponse;
import com.pos.restaurant.modifier.dto.SaveModifierOptionRequest;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.entity.ModifierOption;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import com.pos.restaurant.modifier.repository.ModifierOptionRepository;
import com.pos.restaurant.modifier.support.ModifierGroupAssembler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ModifierOptionCreateHandler {

    private final ModifierGroupRepository groupRepository;
    private final ModifierOptionRepository optionRepository;
    private final FloorTenantSupport tenantSupport;
    private final ModifierGroupAssembler assembler;

    @Transactional
    public ModifierOptionResponse handle(UUID groupId, SaveModifierOptionRequest request) {
        ModifierGroup group = groupRepository.findByIdAndCompanyId(groupId, tenantSupport.requireCompanyId())
            .orElseThrow(() -> new NotFoundException("Modifier group not found: " + groupId));
        ModifierOption saved = optionRepository.save(ModifierOption.builder()
            .group(group)
            .name(request.name().trim())
            .priceDelta(request.priceDelta().setScale(2, RoundingMode.HALF_UP))
            .sortOrder(request.sortOrder() == null ? 100 : request.sortOrder())
            .active(true)
            .build());
        LogUtil.info(ModifierOptionCreateHandler.class, "Modifier option created: id={}", saved.getId());
        return assembler.toOption(saved);
    }
}
