package com.pos.catalog.web;

import com.pos.catalog.dto.CreateProductRequest;
import com.pos.catalog.dto.ProductCardResponse;
import com.pos.catalog.dto.UpdateProductRequest;
import com.pos.catalog.security.CatalogTenantContext;
import com.pos.catalog.service.ProductCommandService;
import com.pos.catalog.service.ProductQueryService;
import com.pos.shared.api.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Каталог товаров (catalog-service)")
public class ProductController {

    private final ProductQueryService queryService;
    private final ProductCommandService commandService;

    @GetMapping
    @Operation(summary = "Список товаров")
    public PageResponse<ProductCardResponse> list(
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "true") boolean activeOnly,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return queryService.page(CatalogTenantContext.requireCompanyId(), search, activeOnly, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Карточка товара")
    public ProductCardResponse get(@PathVariable UUID id) {
        return queryService.getCard(id, CatalogTenantContext.requireCompanyId());
    }

    @PostMapping
    @Operation(summary = "Создать товар")
    public ResponseEntity<ProductCardResponse> create(@Valid @RequestBody CreateProductRequest request) {
        ProductCardResponse created = commandService.create(CatalogTenantContext.requireCompanyId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить товар")
    public ProductCardResponse update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateProductRequest request
    ) {
        return commandService.update(id, CatalogTenantContext.requireCompanyId(), request);
    }
}
