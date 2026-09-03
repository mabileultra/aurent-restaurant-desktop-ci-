package com.pos.restaurant.floor.controller;

import com.pos.restaurant.floor.dto.FloorSnapshotResponse;
import com.pos.restaurant.floor.service.FloorQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Restaurant floor", description = "План зала")
public class FloorQueryController {

    private final FloorQueryService floorQueryService;

    @GetMapping("/stores/{storeId}/floor")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Снимок плана зала")
    @ApiResponse(responseCode = "200", description = "Залы и столы")
    public FloorSnapshotResponse getFloorSnapshot(@PathVariable Integer storeId) {
        return floorQueryService.getSnapshot(storeId);
    }
}
