package com.pos.restaurant.shift.controller;

import com.pos.restaurant.shift.dto.CloseShiftRequest;
import com.pos.restaurant.shift.dto.OpenShiftRequest;
import com.pos.restaurant.shift.dto.ShiftResponse;
import com.pos.restaurant.shift.service.RestaurantShiftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Restaurant shifts", description = "Смены ресторанной кассы")
public class RestaurantShiftController {

    private final RestaurantShiftService shiftService;

    @GetMapping("/stores/{storeId}/shifts/current")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Текущая открытая смена")
    public ResponseEntity<ShiftResponse> current(@PathVariable Integer storeId) {
        return shiftService.findCurrent(storeId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/stores/{storeId}/shifts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "История смен")
    public List<ShiftResponse> list(@PathVariable Integer storeId) {
        return shiftService.list(storeId);
    }

    @PostMapping("/stores/{storeId}/shifts/open")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Открыть смену")
    @ApiResponse(responseCode = "201", description = "Смена открыта")
    public ResponseEntity<ShiftResponse> open(
        @PathVariable Integer storeId,
        @Valid @RequestBody OpenShiftRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shiftService.open(storeId, request));
    }

    @PostMapping("/shifts/{shiftId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Закрыть смену")
    public ShiftResponse close(
        @PathVariable UUID shiftId,
        @Valid @RequestBody CloseShiftRequest request
    ) {
        return shiftService.close(shiftId, request);
    }
}
