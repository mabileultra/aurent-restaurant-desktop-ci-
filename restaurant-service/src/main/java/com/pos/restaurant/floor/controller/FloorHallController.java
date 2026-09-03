package com.pos.restaurant.floor.controller;

import com.pos.restaurant.floor.dto.HallResponse;
import com.pos.restaurant.floor.dto.SaveHallRequest;
import com.pos.restaurant.floor.service.FloorHallService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Restaurant halls", description = "Залы ресторана")
public class FloorHallController {

    private final FloorHallService hallService;

    @GetMapping("/stores/{storeId}/halls")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список залов")
    public List<HallResponse> listHalls(@PathVariable Integer storeId) {
        return hallService.listByStore(storeId);
    }

    @PostMapping("/stores/{storeId}/halls")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать зал")
    @ApiResponse(responseCode = "201", description = "Зал создан")
    public ResponseEntity<HallResponse> createHall(
        @PathVariable Integer storeId,
        @Valid @RequestBody SaveHallRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hallService.create(storeId, request));
    }

    @PutMapping("/halls/{hallId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить зал")
    public HallResponse updateHall(
        @PathVariable Integer hallId,
        @Valid @RequestBody SaveHallRequest request
    ) {
        return hallService.update(hallId, request);
    }

    @DeleteMapping("/halls/{hallId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Деактивировать зал")
    @ApiResponse(responseCode = "204", description = "Зал деактивирован")
    public ResponseEntity<Void> deactivateHall(@PathVariable Integer hallId) {
        hallService.deactivate(hallId);
        return ResponseEntity.noContent().build();
    }
}
