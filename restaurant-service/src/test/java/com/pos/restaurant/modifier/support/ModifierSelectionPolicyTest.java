package com.pos.restaurant.modifier.support;

import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.modifier.entity.ModifierGroup;
import com.pos.restaurant.modifier.entity.ModifierOption;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ModifierSelectionPolicyTest {

    private final ModifierSelectionPolicy policy = new ModifierSelectionPolicy();

    @Test
    void acceptsCountWithinBounds() {
        UUID groupId = UUID.randomUUID();
        ModifierGroup group = ModifierGroup.builder().id(groupId).name("Size").minSelect(1).maxSelect(1).build();
        ModifierOption option = ModifierOption.builder().id(UUID.randomUUID()).name("L").group(group).build();
        assertDoesNotThrow(() -> policy.assertValid(List.of(group), List.of(option)));
    }

    @Test
    void rejectsMissingRequired() {
        UUID groupId = UUID.randomUUID();
        ModifierGroup group = ModifierGroup.builder().id(groupId).name("Size").minSelect(1).maxSelect(1).build();
        assertThrows(ValidationException.class, () -> policy.assertValid(List.of(group), List.of()));
    }
}
