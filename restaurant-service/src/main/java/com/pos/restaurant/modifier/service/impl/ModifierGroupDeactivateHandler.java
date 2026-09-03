package com.pos.restaurant.modifier.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ModifierGroupDeactivateHandler {

    private final ModifierGroupRepository groupRepository;
    private final FloorTenantSupport tenantSupport;

    @Transactional
    public void handle(UUID groupId) {
        ModifierGroup group = groupRepository.findByIdAndCompanyId(groupId, tenantSupport.requireCompanyId())
            .orElseThrow(() -> new NotFoundException("Modifier group not found: " + groupId));
        group.setActive(false);
        LogUtil.info(ModifierGroupDeactivateHandler.class, "Modifier group deactivated: id={}", groupId);
    }
}
