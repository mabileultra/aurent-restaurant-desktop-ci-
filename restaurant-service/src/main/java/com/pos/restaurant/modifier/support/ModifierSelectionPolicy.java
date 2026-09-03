package com.pos.restaurant.modifier.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.entity.ModifierOption;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ModifierSelectionPolicy {

    public void assertValid(List<ModifierGroup> assignedGroups, List<ModifierOption> selected) {
        Map<UUID, List<ModifierOption>> byGroup = selected.stream()
            .collect(Collectors.groupingBy(option -> option.getGroup().getId()));
        for (ModifierOption option : selected) {
            UUID groupId = option.getGroup().getId();
            boolean assigned = assignedGroups.stream().anyMatch(group -> group.getId().equals(groupId));
            if (!assigned) {
                throw new BusinessException("Modifier does not belong to this dish: " + option.getName());
            }
        }
        for (ModifierGroup group : assignedGroups) {
            int count = byGroup.getOrDefault(group.getId(), List.of()).size();
            if (count < group.getMinSelect() || count > group.getMaxSelect()) {
                throw new ValidationException(
                    "Choose from " + group.getMinSelect() + " to " + group.getMaxSelect() + " options in " + group.getName()
                );
            }
        }
    }
}
