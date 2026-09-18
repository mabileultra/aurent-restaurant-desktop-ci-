package com.pos.pharmacy.marks.controller;

import com.pos.pharmacy.marks.dto.StockMarkCheckRequest;
import com.pos.pharmacy.marks.dto.StockMarkCheckResponse;
import com.pos.pharmacy.marks.dto.StockMarkRegisterRequest;
import com.pos.pharmacy.marks.dto.StockMarkRegisterResponse;
import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pharmacy/stock-marks")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Stock Marks", description = "Склад кодов маркировки (IN_STOCK)")
public class PharmacyStockMarkController {

    private final PharmacyStockMarkService stockMarkService;

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
