package com.pos.catalog.web;

import com.pos.catalog.service.ProductDeactivateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/catalog/products")
@RequiredArgsConstructor
@Tag(name = "Internal Catalog Product Lifecycle")
public class InternalCatalogProductLifecycleController {

    private final ProductDeactivateService productDeactivateService;

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Soft-deactivate product (local deactivate mirror)")
    public void deactivate(@PathVariable UUID id) {
        productDeactivateService.deactivate(id);
    }
}
