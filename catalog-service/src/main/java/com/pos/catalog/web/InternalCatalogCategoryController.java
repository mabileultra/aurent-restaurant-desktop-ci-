package com.pos.catalog.web;

import com.pos.catalog.dto.UpsertCategoryRequest;
import com.pos.catalog.exception.CatalogExceptions;
import com.pos.catalog.service.CategoryDeactivateService;
import com.pos.catalog.service.CategoryUpsertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/internal/catalog/categories")
@RequiredArgsConstructor
@Tag(name = "Internal Catalog Categories")
public class InternalCatalogCategoryController {

    private final CategoryUpsertService categoryUpsertService;
    private final CategoryDeactivateService categoryDeactivateService;

    @PutMapping("/{id}")
    @Operation(summary = "Upsert category by stable UUID")
    public void upsert(@PathVariable UUID id, @Valid @RequestBody UpsertCategoryRequest request) {
        if (!id.equals(request.id())) {
            throw CatalogExceptions.badRequest("id в path и body должны совпадать");
        }
        categoryUpsertService.upsert(request);
    }

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Soft-deactivate category (local delete mirror)")
    public void deactivate(@PathVariable UUID id) {
        categoryDeactivateService.deactivate(id);
    }
}
