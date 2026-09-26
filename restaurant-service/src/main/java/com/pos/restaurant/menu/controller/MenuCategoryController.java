package com.pos.restaurant.menu.controller;

import com.pos.restaurant.menu.dto.MenuCategoryResponse;
import com.pos.restaurant.menu.dto.SaveMenuCategoryRequest;
import com.pos.restaurant.menu.service.MenuCategoryService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Menu categories", description = "Разделы меню (не складские категории)")
public class MenuCategoryController {

    private final MenuCategoryService categoryService;

    @GetMapping("/stores/{storeId}/menu-categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Список разделов меню")
    public List<MenuCategoryResponse> list(
        @PathVariable Integer storeId,
        @RequestParam(defaultValue = "false") boolean activeOnly
    ) {
        return categoryService.list(storeId, activeOnly);
    }

    @PostMapping("/stores/{storeId}/menu-categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать раздел меню")
    @ApiResponse(responseCode = "201", description = "Раздел создан")
    public ResponseEntity<MenuCategoryResponse> create(
        @PathVariable Integer storeId,
        @Valid @RequestBody SaveMenuCategoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(storeId, request));
    }

    @PutMapping("/menu-categories/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить раздел меню")
    public MenuCategoryResponse update(
        @PathVariable UUID categoryId,
        @Valid @RequestBody SaveMenuCategoryRequest request
    ) {
        return categoryService.update(categoryId, request);
    }

    @DeleteMapping("/menu-categories/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Скрыть раздел меню")
    @ApiResponse(responseCode = "204", description = "Раздел деактивирован")
    public ResponseEntity<Void> deactivate(@PathVariable UUID categoryId) {
        categoryService.deactivate(categoryId);
        return ResponseEntity.noContent().build();
    }
}
