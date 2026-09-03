package com.pos.restaurant.modifier.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.modifier.entity.ModifierOption;
import com.pos.restaurant.modifier.repository.ModifierOptionRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ModifierOptionDeactivateHandler {

    private final ModifierOptionRepository optionRepository;
    private final FloorTenantSupport tenantSupport;

    @Transactional
    public void handle(UUID optionId) {
        Integer companyId = tenantSupport.requireCompanyId();
        ModifierOption option = optionRepository.findById(optionId)
            .orElseThrow(() -> new NotFoundException("Modifier option not found: " + optionId));
        if (!option.getGroup().getCompanyId().equals(companyId)) {
            throw new NotFoundException("Modifier option not found: " + optionId);
        }
        option.setActive(false);
        LogUtil.info(ModifierOptionDeactivateHandler.class, "Modifier option deactivated: id={}", optionId);
    }
}
