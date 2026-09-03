package com.pos.restaurant.floor.controller;

import com.pos.restaurant.floor.dto.SaveTableRequest;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.dto.UpdateTableLayoutRequest;
import com.pos.restaurant.floor.service.FloorTableService;
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
@Tag(name = "Restaurant tables", description = "Столы ресторана")
public class FloorTableController {

    private final FloorTableService tableService;

    @GetMapping("/halls/{hallId}/tables")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список столов зала")
    public List<TableResponse> listTables(@PathVariable Integer hallId) {
        return tableService.listByHall(hallId);
    }

    @PostMapping("/halls/{hallId}/tables")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать стол")
    @ApiResponse(responseCode = "201", description = "Стол создан")
    public ResponseEntity<TableResponse> createTable(
        @PathVariable Integer hallId,
        @Valid @RequestBody SaveTableRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.create(hallId, request));
    }

    @PutMapping("/tables/{tableId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить стол")
    public TableResponse updateTable(
        @PathVariable Integer tableId,
        @Valid @RequestBody SaveTableRequest request
    ) {
        return tableService.update(tableId, request);
    }

    @PutMapping("/halls/{hallId}/tables/layout")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить расположение столов")
    public List<TableResponse> updateLayout(
        @PathVariable Integer hallId,
        @Valid @RequestBody UpdateTableLayoutRequest request
    ) {
        return tableService.updateLayout(hallId, request);
    }

    @DeleteMapping("/tables/{tableId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Деактивировать стол")
    @ApiResponse(responseCode = "204", description = "Стол деактивирован")
    public ResponseEntity<Void> deactivateTable(@PathVariable Integer tableId) {
        tableService.deactivate(tableId);
        return ResponseEntity.noContent().build();
    }
}
