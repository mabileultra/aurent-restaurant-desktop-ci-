package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.service.EdgeCashRegisterService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Edge stand-in for web-backend {@code /cash-registers}. */
@RestController
@RequestMapping("/cash-registers")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCashRegisterController {

    private final EdgeCashRegisterService registers;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(registers.list(storeId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable Long id) {
        return ResponseEntity.ok(registers.get(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(registers.create(body));
    }
}
