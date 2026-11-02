package com.pos.catalog.web;

import com.pos.catalog.dto.ProductCardResponse;
import com.pos.catalog.dto.UpsertProductRequest;
import com.pos.catalog.exception.CatalogExceptions;
import com.pos.catalog.service.ProductUpsertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/internal/catalog/products")
@RequiredArgsConstructor
@Tag(name = "Internal Catalog Upsert", description = "Dual-write / migration upsert")
public class InternalCatalogUpsertController {

    private final ProductUpsertService upsertService;

    @PutMapping("/{id}")
    @Operation(summary = "Upsert product by stable id")
    public ProductCardResponse upsert(
        @PathVariable UUID id,
        @Valid @RequestBody UpsertProductRequest request
    ) {
        if (!id.equals(request.id())) {
            throw CatalogExceptions.badRequest("id в path и body должны совпадать");
        }
        return upsertService.upsert(request);
    }
}
