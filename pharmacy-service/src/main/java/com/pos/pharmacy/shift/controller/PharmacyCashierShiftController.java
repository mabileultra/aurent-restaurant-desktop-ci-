package com.pos.pharmacy.shift.controller;

import com.pos.pharmacy.shift.dto.ClosePharmacyShiftRequest;
import com.pos.pharmacy.shift.dto.OpenPharmacyShiftRequest;
import com.pos.pharmacy.shift.dto.PharmacyShiftResponse;
import com.pos.pharmacy.shift.service.PharmacyCashierShiftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/pharmacy/shifts")
@RequiredArgsConstructor
@Validated
@Tag(name = "Pharmacy cashier shifts")
public class PharmacyCashierShiftController {

    private final PharmacyCashierShiftService shiftService;

    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'SUPER_ADMIN')")
    @Operation(summary = "Текущая открытая смена кассира")
    public ResponseEntity<PharmacyShiftResponse> current(
        @RequestParam @NotNull @Min(1) Integer storeId
    ) {
        return shiftService.findCurrent(storeId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/open")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'SUPER_ADMIN')")
    @Operation(summary = "Открыть смену")
    public ResponseEntity<PharmacyShiftResponse> open(
        @RequestParam @NotNull @Min(1) Integer storeId,
        @RequestBody(required = false) @Valid OpenPharmacyShiftRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shiftService.open(storeId, request));
    }

    @PostMapping("/{shiftId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'SUPER_ADMIN')")
    @Operation(summary = "Закрыть смену")
    public PharmacyShiftResponse close(
        @PathVariable UUID shiftId,
        @RequestBody(required = false) @Valid ClosePharmacyShiftRequest request
    ) {
        return shiftService.close(shiftId, request);
    }
}
