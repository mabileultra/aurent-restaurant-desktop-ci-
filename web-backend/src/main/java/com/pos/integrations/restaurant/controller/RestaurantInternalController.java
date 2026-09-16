package com.pos.integrations.restaurant.controller;

import com.pos.integrations.restaurant.dto.RestaurantStockConsumeRequest;
import com.pos.integrations.restaurant.service.RestaurantStockConsumeService;
import com.pos.integrations.restaurant.service.RestaurantStockRestoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/restaurant")
@RequiredArgsConstructor
public class RestaurantInternalController {

    private final RestaurantStockConsumeService stockConsumeService;
    private final RestaurantStockRestoreService stockRestoreService;

    @PostMapping("/stock-consume")
    public ResponseEntity<Void> consume(@Valid @RequestBody RestaurantStockConsumeRequest request) {
        stockConsumeService.consume(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/stock-restore")
    public ResponseEntity<Void> restore(@Valid @RequestBody RestaurantStockConsumeRequest request) {
        stockRestoreService.restore(request);
        return ResponseEntity.noContent().build();
    }
}
