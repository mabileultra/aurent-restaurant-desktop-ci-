package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.service.EdgeStockCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Edge stand-in for web-backend {@code /categories}. */
@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCategoryController {

    private final EdgeStockCategoryService categories;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
        @RequestParam(required = false) Integer businessTypeId
    ) {
        return ResponseEntity.ok(categories.list(businessTypeId));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categories.create(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
        @PathVariable Integer id,
        @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.ok(categories.update(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        categories.delete(id);
        return ResponseEntity.ok().build();
    }
}
