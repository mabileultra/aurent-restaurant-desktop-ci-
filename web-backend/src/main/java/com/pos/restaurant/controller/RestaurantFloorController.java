package com.pos.restaurant.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.restaurant.dto.BookingTableOptionResponse;
import com.pos.restaurant.dto.DiningHallResponse;
import com.pos.restaurant.dto.DiningTableResponse;
import com.pos.restaurant.dto.RestaurantFloorSnapshotResponse;
import com.pos.restaurant.dto.SaveDiningHallRequest;
import com.pos.restaurant.dto.SaveDiningTableRequest;
import com.pos.restaurant.dto.SaveTableReservationRequest;
import com.pos.restaurant.dto.TableReservationResponse;
import com.pos.restaurant.dto.UpdateDiningTablesLayoutRequest;
import com.pos.restaurant.service.DiningHallService;
import com.pos.restaurant.service.DiningTableService;
import com.pos.restaurant.service.TableReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/restaurant")
@RequiredArgsConstructor
@Tag(name = "Restaurant", description = "Залы, столы и бронирование")
@StandardApiResponses
public class RestaurantFloorController {

    private final DiningHallService hallService;
    private final DiningTableService tableService;
    private final TableReservationService reservationService;

    @GetMapping("/stores/{storeId}/floor")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Снимок плана зала", description = "Залы и столы магазина для кассы и админки")
    @ApiResponse(responseCode = "200", description = "План зала")
    public RestaurantFloorSnapshotResponse getFloorSnapshot(@PathVariable Integer storeId) {
        return hallService.getFloorSnapshot(storeId);
    }

    @GetMapping("/stores/{storeId}/halls")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список залов", description = "Залы ресторана по магазину")
    public List<DiningHallResponse> listHalls(@PathVariable Integer storeId) {
        return hallService.listByStore(storeId);
    }

    @PostMapping("/stores/{storeId}/halls")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать зал")
    @ApiResponse(responseCode = "201", description = "Зал создан")
    public ResponseEntity<DiningHallResponse> createHall(
        @PathVariable Integer storeId,
        @Valid @RequestBody SaveDiningHallRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hallService.create(storeId, request));
    }

    @PutMapping("/halls/{hallId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить зал")
    public DiningHallResponse updateHall(
        @PathVariable Integer hallId,
        @Valid @RequestBody SaveDiningHallRequest request
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

    @GetMapping("/halls/{hallId}/tables")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список столов зала")
    public List<DiningTableResponse> listTables(@PathVariable Integer hallId) {
        return tableService.listByHall(hallId);
    }

    @PostMapping("/halls/{hallId}/tables")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать стол")
    @ApiResponse(responseCode = "201", description = "Стол создан")
    public ResponseEntity<DiningTableResponse> createTable(
        @PathVariable Integer hallId,
        @Valid @RequestBody SaveDiningTableRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.create(hallId, request));
    }

    @PutMapping("/tables/{tableId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить стол")
    public DiningTableResponse updateTable(
        @PathVariable Integer tableId,
        @Valid @RequestBody SaveDiningTableRequest request
    ) {
        return tableService.update(tableId, request);
    }

    @PutMapping("/halls/{hallId}/tables/layout")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить расположение столов")
    public List<DiningTableResponse> updateLayout(
        @PathVariable Integer hallId,
        @Valid @RequestBody UpdateDiningTablesLayoutRequest request
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

    @GetMapping("/stores/{storeId}/booking-tables")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Столы для бронирования", description = "Плоский список активных столов ресторана")
    public List<BookingTableOptionResponse> listBookingTables(@PathVariable Integer storeId) {
        return hallService.listBookingTables(storeId);
    }

    @GetMapping("/stores/{storeId}/reservations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Список броней", description = "Брони ресторана за период")
    public List<TableReservationResponse> listReservations(
        @PathVariable Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(name = "activeOnly", defaultValue = "false") boolean activeOnly
    ) {
        if (activeOnly) {
            return reservationService.listActive(storeId);
        }
        return reservationService.listByStore(storeId, from, to);
    }

    @GetMapping("/reservations/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Детали брони")
    public TableReservationResponse getReservation(@PathVariable UUID reservationId) {
        return reservationService.getById(reservationId);
    }

    @PostMapping("/stores/{storeId}/reservations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Создать бронь")
    @ApiResponse(responseCode = "201", description = "Бронь создана")
    public ResponseEntity<TableReservationResponse> createReservation(
        @PathVariable Integer storeId,
        @Valid @RequestBody SaveTableReservationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationService.create(storeId, request));
    }

    @PutMapping("/reservations/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Обновить бронь")
    public TableReservationResponse updateReservation(
        @PathVariable UUID reservationId,
        @Valid @RequestBody SaveTableReservationRequest request
    ) {
        return reservationService.update(reservationId, request);
    }

    @PostMapping("/reservations/{reservationId}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Подтвердить бронь")
    public TableReservationResponse confirmReservation(@PathVariable UUID reservationId) {
        return reservationService.confirm(reservationId);
    }

    @PostMapping("/reservations/{reservationId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Отменить бронь")
    public TableReservationResponse cancelReservation(@PathVariable UUID reservationId) {
        return reservationService.cancel(reservationId);
    }

    @PostMapping("/reservations/{reservationId}/no-show")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Неявка гостя")
    public TableReservationResponse noShowReservation(@PathVariable UUID reservationId) {
        return reservationService.markNoShow(reservationId);
    }
}
