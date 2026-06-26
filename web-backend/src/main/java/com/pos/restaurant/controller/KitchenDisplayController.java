package com.pos.restaurant.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.restaurant.dto.KitchenDepartmentResponse;
import com.pos.restaurant.dto.KitchenTicketResponse;
import com.pos.restaurant.dto.SaveKitchenDepartmentRequest;
import com.pos.restaurant.dto.TableSessionResponse;
import com.pos.restaurant.dto.UpdateKitchenTicketStatusRequest;
import com.pos.restaurant.service.KitchenDepartmentService;
import com.pos.restaurant.service.KitchenTicketService;
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
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/restaurant")
@RequiredArgsConstructor
@Tag(name = "Restaurant kitchen", description = "Кухонный дисплей (KDS)")
@StandardApiResponses
public class KitchenDisplayController {

    private final KitchenTicketService kitchenTicketService;
    private final KitchenDepartmentService kitchenDepartmentService;

    @GetMapping("/kitchen/departments")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Список цехов кухни")
    public List<KitchenDepartmentResponse> listDepartments() {
        return kitchenDepartmentService.list();
    }

    @PostMapping("/kitchen/departments")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Добавить цех кухни")
    @ApiResponse(responseCode = "201", description = "Цех создан")
    public ResponseEntity<KitchenDepartmentResponse> createDepartment(
        @Valid @RequestBody SaveKitchenDepartmentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(kitchenDepartmentService.create(request));
    }

    @PutMapping("/kitchen/departments/{entryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить цех кухни")
    public KitchenDepartmentResponse updateDepartment(
        @PathVariable Integer entryId,
        @Valid @RequestBody SaveKitchenDepartmentRequest request
    ) {
        return kitchenDepartmentService.update(entryId, request);
    }

    @DeleteMapping("/kitchen/departments/{entryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Удалить цех кухни")
    @ApiResponse(responseCode = "204", description = "Цех удалён")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Integer entryId) {
        kitchenDepartmentService.delete(entryId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sessions/{sessionId}/send-to-kitchen")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Отправить на кухню", description = "Создать тикеты для новых позиций сессии")
    public TableSessionResponse sendToKitchen(
        @PathVariable UUID sessionId,
        @RequestParam(required = false) String department
    ) {
        return kitchenTicketService.sendToKitchen(sessionId, department);
    }

    @GetMapping("/stores/{storeId}/kitchen/tickets")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Активные кухонные тикеты")
    public List<KitchenTicketResponse> listTickets(
        @PathVariable Integer storeId,
        @RequestParam(required = false) String department
    ) {
        return kitchenTicketService.listActiveTickets(storeId, department);
    }

    @PatchMapping("/kitchen/tickets/{ticketId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Обновить статус тикета")
    public KitchenTicketResponse updateStatus(
        @PathVariable UUID ticketId,
        @Valid @RequestBody UpdateKitchenTicketStatusRequest request
    ) {
        return kitchenTicketService.updateStatus(ticketId, request);
    }
}
