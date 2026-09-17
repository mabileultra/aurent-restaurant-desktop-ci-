package com.pos.pharmacy.sales.controller;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.dto.MarkSoldCheckRequest;
import com.pos.pharmacy.sales.dto.MarkSoldCheckResponse;
import com.pos.pharmacy.sales.dto.PartialReturnRequest;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.service.PharmacySaleCheckoutService;
import com.pos.pharmacy.sales.service.PharmacySalePartialReturnService;
import com.pos.pharmacy.sales.service.PharmacySaleQueryService;
import com.pos.pharmacy.sales.service.PharmacySaleVoidService;
import com.pos.pharmacy.sales.service.PharmacySoldMarkService;
import com.pos.pharmacy.security.PharmacyTenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/pharmacy/sales")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Sales", description = "Аптечные продажи и возвраты")
public class PharmacySaleController {

    private final PharmacySaleCheckoutService checkoutService;
    private final PharmacySaleVoidService voidService;
    private final PharmacySalePartialReturnService partialReturnService;
    private final PharmacySaleQueryService queryService;
    private final PharmacySoldMarkService soldMarkService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Оформить аптечную продажу")
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody CreateSaleRequest request) {
        UUID cashierId = PharmacyTenantContext.getUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(checkoutService.processSale(request, cashierId));
    }

    @PostMapping("/marks/check")
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Проверить, был ли КМ уже продан в нашей системе")
    public ResponseEntity<MarkSoldCheckResponse> checkMarkSold(@Valid @RequestBody MarkSoldCheckRequest request) {
        return ResponseEntity.ok(soldMarkService.checkSold(request.storeId(), request.code()));
    }

    @GetMapping("/receipt/{receiptNumber}")
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Чек по номеру")
    public ResponseEntity<SaleResponse> getByReceipt(@PathVariable String receiptNumber) {
        return ResponseEntity.ok(queryService.getByReceiptNumber(receiptNumber));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Продажа по ID")
    public ResponseEntity<SaleResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(queryService.getById(id));
    }

    @GetMapping("/my-sales")
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Мои продажи")
    public ResponseEntity<PageResponse<SaleResponse>> mySales(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) UUID shiftId,
        @PageableDefault(size = 50) Pageable pageable
    ) {
        return ResponseEntity.ok(queryService.mySales(storeId, shiftId, pageable));
    }

    @PostMapping("/{id}/void")
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Аннулировать чек")
    public ResponseEntity<SaleResponse> voidSale(
        @PathVariable UUID id,
        @RequestParam(required = false) String reason
    ) {
        return ResponseEntity.ok(voidService.voidSale(id, reason));
    }

    @PostMapping("/{id}/return-items")
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Частичный возврат")
    public ResponseEntity<SaleResponse> returnItems(
        @PathVariable UUID id,
        @Valid @RequestBody PartialReturnRequest request
    ) {
        return ResponseEntity.ok(partialReturnService.returnItems(id, request));
    }
}
