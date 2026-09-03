package com.pos.restaurant.modifier.controller;

import com.pos.restaurant.modifier.dto.ModifierGroupResponse;
import com.pos.restaurant.modifier.dto.ModifierOptionResponse;
import com.pos.restaurant.modifier.dto.SaveModifierGroupRequest;
import com.pos.restaurant.modifier.dto.SaveModifierOptionRequest;
import com.pos.restaurant.modifier.service.ModifierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Menu modifiers", description = "Группы модификаторов блюд")
public class ModifierController {

    private final ModifierService modifierService;

    @GetMapping("/stores/{storeId}/modifier-groups")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Список групп модификаторов")
    public List<ModifierGroupResponse> listByStore(@PathVariable Integer storeId) {
        return modifierService.listByStore(storeId);
    }

    @GetMapping("/menu-items/{itemId}/modifier-groups")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Модификаторы блюда")
    public List<ModifierGroupResponse> listForMenuItem(@PathVariable UUID itemId) {
        return modifierService.listForMenuItem(itemId);
    }

    @PostMapping("/stores/{storeId}/modifier-groups")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать группу")
    @ApiResponse(responseCode = "201", description = "Группа создана")
    public ResponseEntity<ModifierGroupResponse> createGroup(
        @PathVariable Integer storeId,
        @Valid @RequestBody SaveModifierGroupRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(modifierService.createGroup(storeId, request));
    }

    @PutMapping("/modifier-groups/{groupId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить группу")
    public ModifierGroupResponse updateGroup(
        @PathVariable UUID groupId,
        @Valid @RequestBody SaveModifierGroupRequest request
    ) {
        return modifierService.updateGroup(groupId, request);
    }

    @DeleteMapping("/modifier-groups/{groupId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Скрыть группу")
    public ResponseEntity<Void> deactivateGroup(@PathVariable UUID groupId) {
        modifierService.deactivateGroup(groupId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/modifier-groups/{groupId}/options")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Добавить опцию")
    public ResponseEntity<ModifierOptionResponse> createOption(
        @PathVariable UUID groupId,
        @Valid @RequestBody SaveModifierOptionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(modifierService.createOption(groupId, request));
    }

    @PutMapping("/modifier-options/{optionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить опцию")
    public ModifierOptionResponse updateOption(
        @PathVariable UUID optionId,
        @Valid @RequestBody SaveModifierOptionRequest request
    ) {
        return modifierService.updateOption(optionId, request);
    }

    @DeleteMapping("/modifier-options/{optionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Скрыть опцию")
    public ResponseEntity<Void> deactivateOption(@PathVariable UUID optionId) {
        modifierService.deactivateOption(optionId);
        return ResponseEntity.noContent().build();
    }
}
