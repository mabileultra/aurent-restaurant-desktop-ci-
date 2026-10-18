package com.pos.restaurant.edge.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Local edge has no pos-core company types — return restaurant so FE gates stay open. */
@RestController
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
@Tag(name = "Edge business-types stub")
public class EdgeBusinessTypeStubController {

    @GetMapping("/company-business-types")
    @Operation(summary = "Restaurant default for edge hall PC")
    public ResponseEntity<Map<String, Object>> companyBusinessTypes() {
        return ResponseEntity.ok(Map.of(
            "defaultTypeCode", "RESTAURANT",
            "types", List.of(Map.of("code", "RESTAURANT", "name", "Restaurant"))
        ));
    }
}
