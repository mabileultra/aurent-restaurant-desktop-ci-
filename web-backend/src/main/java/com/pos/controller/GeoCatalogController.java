package com.pos.controller;

import com.pos.dto.geo.GeoDistrictResponse;
import com.pos.dto.geo.GeoRegionResponse;
import com.pos.service.GeoCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/geo")
@RequiredArgsConstructor
@Tag(name = "Geo SOATO")
public class GeoCatalogController {

    private final GeoCatalogService geoCatalogService;

    @GetMapping("/regions")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')")
    @Operation(summary = "List SOATO regions of Uzbekistan")
    public ResponseEntity<List<GeoRegionResponse>> regions() {
        return ResponseEntity.ok(geoCatalogService.listRegions());
    }

    @GetMapping("/regions/{regionCode}/districts")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SUPER_ADMIN','PLATFORM_ADMIN','PLATFORM_ANALYTICS')")
    @Operation(summary = "List districts/cities for a region")
    public ResponseEntity<List<GeoDistrictResponse>> districts(@PathVariable String regionCode) {
        return ResponseEntity.ok(geoCatalogService.listDistricts(regionCode));
    }
}
