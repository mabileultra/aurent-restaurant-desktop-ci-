package com.pos.restaurant.modifier.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.modifier.dto.ModifierGroupResponse;
import com.pos.restaurant.modifier.dto.ModifierOptionResponse;
import com.pos.restaurant.modifier.dto.SaveModifierGroupRequest;
import com.pos.restaurant.modifier.dto.SaveModifierOptionRequest;
import com.pos.restaurant.modifier.entity.MenuItemModifierLink;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.entity.ModifierOption;
import com.pos.restaurant.modifier.repository.MenuItemModifierLinkRepository;
import com.pos.restaurant.modifier.repository.ModifierGroupRepository;
import com.pos.restaurant.modifier.repository.ModifierOptionRepository;
import com.pos.restaurant.modifier.service.ModifierService;
import com.pos.restaurant.modifier.support.ModifierGroupAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ModifierServiceImpl implements ModifierService {

    private final ModifierGroupRepository groupRepository;
    private final ModifierOptionRepository optionRepository;
    private final MenuItemModifierLinkRepository linkRepository;
    private final MenuItemRepository menuItemRepository;
    private final FloorTenantSupport tenantSupport;
    private final ModifierGroupAssembler assembler;
    private final ModifierGroupCreateHandler createGroupHandler;
    private final ModifierGroupUpdateHandler updateGroupHandler;
    private final ModifierGroupDeactivateHandler deactivateGroupHandler;
    private final ModifierOptionCreateHandler createOptionHandler;
    private final ModifierOptionUpdateHandler updateOptionHandler;
    private final ModifierOptionDeactivateHandler deactivateOptionHandler;

    @Override
    public List<ModifierGroupResponse> listByStore(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        List<ModifierGroup> groups = groupRepository
            .findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId);
        return assemble(groups);
    }

    @Override
    public List<ModifierGroupResponse> listForMenuItem(UUID menuItemId) {
        Integer companyId = tenantSupport.requireCompanyId();
        var item = menuItemRepository.findByIdAndCompanyId(menuItemId, companyId)
            .orElseThrow(() -> new NotFoundException("Menu item not found: " + menuItemId));
        List<UUID> groupIds = linkRepository.findByMenuItemId(item.getId()).stream()
            .map(MenuItemModifierLink::getGroupId)
            .toList();
        if (groupIds.isEmpty()) {
            return List.of();
        }
        List<ModifierGroup> groups = groupRepository.findByIdInAndCompanyIdAndStoreIdAndActiveTrue(
            groupIds, companyId, item.getStoreId()
        );
        return assemble(groups);
    }

    private List<ModifierGroupResponse> assemble(List<ModifierGroup> groups) {
        if (groups.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = groups.stream().map(ModifierGroup::getId).toList();
        List<ModifierOption> options = optionRepository.findByGroupIdInAndActiveTrueOrderBySortOrderAscNameAsc(ids);
        return assembler.toResponses(groups, options);
    }

    @Override
    @Transactional
    public ModifierGroupResponse createGroup(Integer storeId, SaveModifierGroupRequest request) {
        return createGroupHandler.handle(storeId, request);
    }

    @Override
    @Transactional
    public ModifierGroupResponse updateGroup(UUID groupId, SaveModifierGroupRequest request) {
        return updateGroupHandler.handle(groupId, request);
    }

    @Override
    @Transactional
    public void deactivateGroup(UUID groupId) {
        deactivateGroupHandler.handle(groupId);
    }

    @Override
    @Transactional
    public ModifierOptionResponse createOption(UUID groupId, SaveModifierOptionRequest request) {
        return createOptionHandler.handle(groupId, request);
    }

    @Override
    @Transactional
    public ModifierOptionResponse updateOption(UUID optionId, SaveModifierOptionRequest request) {
        return updateOptionHandler.handle(optionId, request);
    }

    @Override
    @Transactional
    public void deactivateOption(UUID optionId) {
        deactivateOptionHandler.handle(optionId);
    }
}
