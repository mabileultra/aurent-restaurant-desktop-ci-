package com.pos.platform.controller;

import com.pos.platform.dto.geo.GeoDistrictResponse;
import com.pos.platform.dto.geo.GeoRegionResponse;
import com.pos.platform.service.GeoCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/platform/geo")
@RequiredArgsConstructor
@Tag(name = "Platform geo")
public class GeoCatalogController {

    private final GeoCatalogService geoCatalogService;

    @GetMapping("/regions")
    @Operation(summary = "List SOATO regions of Uzbekistan")
    public ResponseEntity<List<GeoRegionResponse>> regions() {
        return ResponseEntity.ok(geoCatalogService.listRegions());
    }

    @GetMapping("/regions/{regionCode}/districts")
    @Operation(summary = "List districts/cities for a region")
    public ResponseEntity<List<GeoDistrictResponse>> districts(@PathVariable String regionCode) {
        return ResponseEntity.ok(geoCatalogService.listDistricts(regionCode));
    }
}
