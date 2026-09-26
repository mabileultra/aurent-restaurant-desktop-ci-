package com.pos.restaurant.modifier.support;

import com.pos.restaurant.modifier.dto.ModifierGroupResponse;
import com.pos.restaurant.modifier.dto.ModifierOptionResponse;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.entity.ModifierOption;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ModifierGroupAssembler {

    public ModifierGroupResponse toResponse(ModifierGroup group, List<ModifierOption> options) {
        return new ModifierGroupResponse(
            group.getId(),
            group.getStoreId(),
            group.getName(),
            group.getGroupKind() == null
                ? com.pos.restaurant.modifier.domain.ModifierGroupKind.STANDARD
                : group.getGroupKind(),
            group.getMinSelect(),
            group.getMaxSelect(),
            group.getSortOrder(),
            group.isAvailableForAll(),
            group.isActive(),
            options.stream().map(this::toOption).toList()
        );
    }

    public List<ModifierGroupResponse> toResponses(List<ModifierGroup> groups, List<ModifierOption> options) {
        Map<UUID, List<ModifierOption>> byGroup = options.stream()
            .collect(Collectors.groupingBy(option -> option.getGroup().getId()));
        return groups.stream()
            .map(group -> toResponse(group, byGroup.getOrDefault(group.getId(), List.of())))
            .toList();
    }

    public ModifierOptionResponse toOption(ModifierOption option) {
        return new ModifierOptionResponse(
            option.getId(),
            option.getName(),
            option.getPriceDelta(),
            option.getSortOrder(),
            option.isActive()
        );
    }
}
