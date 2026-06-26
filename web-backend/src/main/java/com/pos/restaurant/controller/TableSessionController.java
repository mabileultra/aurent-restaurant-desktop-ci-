package com.pos.restaurant.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.sale.SaleResponse;
import com.pos.restaurant.dto.AddTableSessionLineRequest;
import com.pos.restaurant.dto.AssignWaiterRequest;
import com.pos.restaurant.dto.OpenTableSessionRequest;
import com.pos.restaurant.dto.TableSessionCheckoutPreviewResponse;
import com.pos.restaurant.dto.TableSessionCheckoutRequest;
import com.pos.restaurant.dto.TableSessionResponse;
import com.pos.restaurant.dto.UpdateTableSessionLineRequest;
import com.pos.restaurant.service.TableSessionService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/restaurant")
@RequiredArgsConstructor
@Tag(name = "Restaurant sessions", description = "Счета на столах ресторана")
@StandardApiResponses
public class TableSessionController {

    private final TableSessionService sessionService;

    @PostMapping("/tables/{tableId}/sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Открыть стол", description = "Создать открытую сессию на столе")
    @ApiResponse(responseCode = "201", description = "Сессия создана")
    public ResponseEntity<TableSessionResponse> openSession(
        @PathVariable Integer tableId,
        @Valid @RequestBody OpenTableSessionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.openSession(tableId, request));
    }

    @GetMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Детали сессии", description = "Сессия стола с позициями")
    public TableSessionResponse getSession(@PathVariable UUID sessionId) {
        return sessionService.getSession(sessionId);
    }

    @PostMapping("/sessions/{sessionId}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Добавить позицию")
    @ApiResponse(responseCode = "201", description = "Позиция добавлена")
    public ResponseEntity<TableSessionResponse> addLine(
        @PathVariable UUID sessionId,
        @Valid @RequestBody AddTableSessionLineRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.addLine(sessionId, request));
    }

    @PutMapping("/sessions/{sessionId}/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Изменить позицию")
    public TableSessionResponse updateLine(
        @PathVariable UUID sessionId,
        @PathVariable UUID lineId,
        @Valid @RequestBody UpdateTableSessionLineRequest request
    ) {
        return sessionService.updateLine(sessionId, lineId, request);
    }

    @DeleteMapping("/sessions/{sessionId}/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Удалить позицию")
    @ApiResponse(responseCode = "200", description = "Позиция удалена")
    public TableSessionResponse removeLine(
        @PathVariable UUID sessionId,
        @PathVariable UUID lineId
    ) {
        return sessionService.removeLine(sessionId, lineId);
    }

    @PatchMapping("/sessions/{sessionId}/waiter")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Назначить официанта")
    public TableSessionResponse assignWaiter(
        @PathVariable UUID sessionId,
        @Valid @RequestBody AssignWaiterRequest request
    ) {
        return sessionService.assignWaiter(sessionId, request);
    }

    @PostMapping("/sessions/{sessionId}/checkout-preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Предпросмотр оплаты")
    public TableSessionCheckoutPreviewResponse checkoutPreview(@PathVariable UUID sessionId) {
        return sessionService.buildCheckoutPreview(sessionId);
    }

    @PostMapping("/sessions/{sessionId}/checkout")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER')")
    @Operation(summary = "Оплатить стол", description = "Закрыть сессию и оформить продажу")
    @ApiResponse(responseCode = "201", description = "Продажа создана")
    public ResponseEntity<SaleResponse> checkout(
        @PathVariable UUID sessionId,
        @Valid @RequestBody TableSessionCheckoutRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.checkout(sessionId, request));
    }

    @PostMapping("/sessions/{sessionId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Отменить сессию", description = "Отмена без оплаты (только менеджер)")
    @ApiResponse(responseCode = "204", description = "Сессия отменена")
    public ResponseEntity<Void> cancelSession(@PathVariable UUID sessionId) {
        sessionService.cancelSession(sessionId);
        return ResponseEntity.noContent().build();
    }
}
