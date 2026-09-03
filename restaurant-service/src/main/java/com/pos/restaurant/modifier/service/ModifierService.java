package com.pos.restaurant.modifier.service;

import com.pos.restaurant.modifier.dto.ModifierGroupResponse;
import com.pos.restaurant.modifier.dto.ModifierOptionResponse;
import com.pos.restaurant.modifier.dto.SaveModifierGroupRequest;
import com.pos.restaurant.modifier.dto.SaveModifierOptionRequest;

import java.util.List;
import java.util.UUID;

public interface ModifierService {

    List<ModifierGroupResponse> listByStore(Integer storeId);

    List<ModifierGroupResponse> listForMenuItem(UUID menuItemId);

    ModifierGroupResponse createGroup(Integer storeId, SaveModifierGroupRequest request);

    ModifierGroupResponse updateGroup(UUID groupId, SaveModifierGroupRequest request);

    void deactivateGroup(UUID groupId);

    ModifierOptionResponse createOption(UUID groupId, SaveModifierOptionRequest request);

    ModifierOptionResponse updateOption(UUID optionId, SaveModifierOptionRequest request);

    void deactivateOption(UUID optionId);
}
