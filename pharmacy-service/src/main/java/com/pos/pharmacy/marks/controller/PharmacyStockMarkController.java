package com.pos.pharmacy.marks.controller;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.marks.dto.StockMarkCheckRequest;
import com.pos.pharmacy.marks.dto.StockMarkCheckResponse;
import com.pos.pharmacy.marks.dto.StockMarkListItemResponse;
import com.pos.pharmacy.marks.dto.StockMarkRegisterRequest;
import com.pos.pharmacy.marks.dto.StockMarkRegisterResponse;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.service.PharmacyStockMarkListService;
import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/pharmacy/stock-marks")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Stock Marks", description = "Склад кодов маркировки и мониторинг ASL")
public class PharmacyStockMarkController {

    private final PharmacyStockMarkService stockMarkService;
    private final PharmacyStockMarkListService stockMarkListService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Мониторинг КМ: продажа vs статус ASL (выбытие)")
    public ResponseEntity<PageResponse<StockMarkListItemResponse>> list(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) StockMarkStatus status,
        @RequestParam(required = false) UUID shiftId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant soldFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant soldTo,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "true") boolean problemsOnly,
        @PageableDefault(size = 50) Pageable pageable
    ) {
        return ResponseEntity.ok(stockMarkListService.list(
            storeId,
            status,
            shiftId,
            soldFrom,
            soldTo,
            search,
            problemsOnly,
            pageable
        ));
    }

    @PostMapping("/check")
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Есть ли КМ на складе магазина (IN_STOCK)")
    public ResponseEntity<StockMarkCheckResponse> check(@Valid @RequestBody StockMarkCheckRequest request) {
        return ResponseEntity.ok(stockMarkService.findInStock(request.storeId(), request.code()));
    }

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Зарегистрировать КМ на складе после приёмки/verify")
    public ResponseEntity<StockMarkRegisterResponse> register(@Valid @RequestBody StockMarkRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockMarkService.registerInStock(request));
    }
}
