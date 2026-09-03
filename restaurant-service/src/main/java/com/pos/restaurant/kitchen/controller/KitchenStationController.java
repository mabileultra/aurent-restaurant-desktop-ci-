package com.pos.restaurant.kitchen.controller;

import com.pos.restaurant.kitchen.dto.SaveStationRequest;
import com.pos.restaurant.kitchen.dto.StationResponse;
import com.pos.restaurant.kitchen.service.KitchenStationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
@Tag(name = "Kitchen stations", description = "Кухонные станции ресторана")
public class KitchenStationController {

    private final KitchenStationService stationService;

    @GetMapping("/stores/{storeId}/kitchen-stations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Список станций")
    public List<StationResponse> list(
        @PathVariable Integer storeId,
        @RequestParam(defaultValue = "false") boolean activeOnly
    ) {
        return stationService.list(storeId, activeOnly);
    }

    @PostMapping("/stores/{storeId}/kitchen-stations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать станцию")
    @ApiResponse(responseCode = "201", description = "Станция создана")
    public ResponseEntity<StationResponse> create(
        @PathVariable Integer storeId,
        @Valid @RequestBody SaveStationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stationService.create(storeId, request));
    }

    @PutMapping("/kitchen-stations/{stationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить станцию")
    public StationResponse update(
        @PathVariable UUID stationId,
        @Valid @RequestBody SaveStationRequest request
    ) {
        return stationService.update(stationId, request);
    }

    @DeleteMapping("/kitchen-stations/{stationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Скрыть станцию")
    @ApiResponse(responseCode = "204", description = "Станция деактивирована")
    public ResponseEntity<Void> deactivate(@PathVariable UUID stationId) {
        stationService.deactivate(stationId);
        return ResponseEntity.noContent().build();
    }
}
