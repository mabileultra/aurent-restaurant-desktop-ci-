package com.pos.restaurant.menu.controller;

import com.pos.restaurant.menu.dto.CreateMenuVariantRequest;
import com.pos.restaurant.menu.dto.MenuItemResponse;
import com.pos.restaurant.menu.dto.SaveMenuItemRequest;
import com.pos.restaurant.menu.service.MenuItemImageService;
import com.pos.restaurant.menu.service.MenuItemService;
import com.pos.restaurant.menu.support.MenuItemDataUriParser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
@Tag(name = "Restaurant menu", description = "Каталог блюд ресторана")
public class MenuItemController {

    private final MenuItemService menuItemService;
    private final MenuItemImageService menuItemImageService;

    @GetMapping("/stores/{storeId}/menu-items")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Список блюд")
    public List<MenuItemResponse> list(
        @PathVariable Integer storeId,
        @RequestParam(defaultValue = "false") boolean posOnly
    ) {
        return menuItemService.list(storeId, posOnly);
    }

    @PostMapping("/stores/{storeId}/menu-items")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Добавить блюдо")
    @ApiResponse(responseCode = "201", description = "Блюдо создано")
    public ResponseEntity<MenuItemResponse> create(
        @PathVariable Integer storeId,
        @Valid @RequestBody SaveMenuItemRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.create(storeId, request));
    }

    @GetMapping("/menu-items/{itemId}/image")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Фото блюда (отдельно от списка — список не тащит base64)")
    public ResponseEntity<byte[]> image(@PathVariable UUID itemId) {
        MenuItemDataUriParser.Parsed image = menuItemImageService.getImage(itemId);
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
            .contentType(MediaType.parseMediaType(image.contentType()))
            .body(image.bytes());
    }

    @PutMapping("/menu-items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить блюдо")
    public MenuItemResponse update(
        @PathVariable UUID itemId,
        @Valid @RequestBody SaveMenuItemRequest request
    ) {
        return menuItemService.update(itemId, request);
    }

    @PostMapping("/menu-items/{itemId}/variants")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Добавить размер-вариант блюда (своя цена и порция)")
    @ApiResponse(responseCode = "201", description = "Вариант создан")
    public ResponseEntity<MenuItemResponse> createVariant(
        @PathVariable UUID itemId,
        @Valid @RequestBody CreateMenuVariantRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.createVariant(itemId, request));
    }

    @DeleteMapping("/menu-items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Скрыть блюдо")
    @ApiResponse(responseCode = "204", description = "Блюдо деактивировано")
    public ResponseEntity<Void> deactivate(@PathVariable UUID itemId) {
        menuItemService.deactivate(itemId);
        return ResponseEntity.noContent().build();
    }
}
