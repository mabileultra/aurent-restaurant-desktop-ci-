package com.pos.restaurant.recipe.controller;

import com.pos.restaurant.recipe.dto.RecipeResponse;
import com.pos.restaurant.recipe.dto.SaveRecipeRequest;
import com.pos.restaurant.recipe.service.RecipeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Restaurant recipes", description = "Техкарты блюд")
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping("/stores/{storeId}/recipes")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список техкарт филиала")
    public List<RecipeResponse> list(@PathVariable Integer storeId) {
        return recipeService.list(storeId);
    }

    @GetMapping("/menu-items/{menuItemId}/recipe")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Техкарта блюда")
    public RecipeResponse get(@PathVariable UUID menuItemId) {
        return recipeService.getByMenuItem(menuItemId);
    }

    @PutMapping("/menu-items/{menuItemId}/recipe")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Сохранить техкарту")
    public RecipeResponse save(
        @PathVariable UUID menuItemId,
        @Valid @RequestBody SaveRecipeRequest request
    ) {
        return recipeService.save(menuItemId, request);
    }
}
