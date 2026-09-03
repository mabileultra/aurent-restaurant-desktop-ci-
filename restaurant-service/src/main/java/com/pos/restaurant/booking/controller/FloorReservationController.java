package com.pos.restaurant.booking.controller;

import com.pos.restaurant.booking.dto.BookingTableOptionResponse;
import com.pos.restaurant.booking.dto.ReservationResponse;
import com.pos.restaurant.booking.dto.SaveReservationRequest;
import com.pos.restaurant.booking.service.FloorReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Floor reservations", description = "Бронирование столов ресторана")
public class FloorReservationController {

    private final FloorReservationService reservationService;

    @GetMapping("/stores/{storeId}/booking-tables")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Столы для брони")
    public List<BookingTableOptionResponse> listBookingTables(@PathVariable Integer storeId) {
        return reservationService.listBookingTables(storeId);
    }

    @GetMapping("/stores/{storeId}/reservations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Список броней")
    public List<ReservationResponse> list(
        @PathVariable Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(defaultValue = "false") boolean activeOnly
    ) {
        return reservationService.list(storeId, from, to, activeOnly);
    }

    @GetMapping("/reservations/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Бронь по id")
    public ReservationResponse get(@PathVariable UUID reservationId) {
        return reservationService.get(reservationId);
    }

    @PostMapping("/stores/{storeId}/reservations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Создать бронь")
    @ApiResponse(responseCode = "201", description = "Бронь создана")
    public ResponseEntity<ReservationResponse> create(
        @PathVariable Integer storeId,
        @Valid @RequestBody SaveReservationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationService.create(storeId, request));
    }

    @PutMapping("/reservations/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Обновить бронь")
    public ReservationResponse update(
        @PathVariable UUID reservationId,
        @Valid @RequestBody SaveReservationRequest request
    ) {
        return reservationService.update(reservationId, request);
    }

    @PostMapping("/reservations/{reservationId}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Подтвердить бронь")
    public ReservationResponse confirm(@PathVariable UUID reservationId) {
        return reservationService.confirm(reservationId);
    }

    @PostMapping("/reservations/{reservationId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Отменить бронь")
    public ReservationResponse cancel(@PathVariable UUID reservationId) {
        return reservationService.cancel(reservationId);
    }

    @PostMapping("/reservations/{reservationId}/no-show")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Неявка")
    public ReservationResponse noShow(@PathVariable UUID reservationId) {
        return reservationService.markNoShow(reservationId);
    }

    @PostMapping("/reservations/{reservationId}/seat")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Посадить гостей")
    public ReservationResponse seat(@PathVariable UUID reservationId) {
        return reservationService.seat(reservationId);
    }
}
