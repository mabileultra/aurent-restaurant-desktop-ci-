package com.pos.restaurant.modifier.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.modifier.dto.ModifierOptionResponse;
import com.pos.restaurant.modifier.dto.SaveModifierOptionRequest;
import com.pos.restaurant.modifier.entity.ModifierOption;
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
public class ModifierOptionUpdateHandler {

    private final ModifierOptionRepository optionRepository;
    private final FloorTenantSupport tenantSupport;
    private final ModifierGroupAssembler assembler;

    @Transactional
    public ModifierOptionResponse handle(UUID optionId, SaveModifierOptionRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        ModifierOption option = optionRepository.findById(optionId)
            .orElseThrow(() -> new NotFoundException("Modifier option not found: " + optionId));
        if (!option.getGroup().getCompanyId().equals(companyId)) {
            throw new NotFoundException("Modifier option not found: " + optionId);
        }
        option.setName(request.name().trim());
        option.setPriceDelta(request.priceDelta().setScale(2, RoundingMode.HALF_UP));
        if (request.sortOrder() != null) {
            option.setSortOrder(request.sortOrder());
        }
        LogUtil.info(ModifierOptionUpdateHandler.class, "Modifier option updated: id={}", optionId);
        return assembler.toOption(option);
    }
}
