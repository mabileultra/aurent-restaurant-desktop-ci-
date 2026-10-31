package com.pos.restaurant.store.controller;

import com.pos.restaurant.store.dto.InternalStoreUpsertRequest;
import com.pos.restaurant.store.service.CloudStoreMirrorService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Hidden
@RestController
@RequestMapping("/internal/rst/stores")
@RequiredArgsConstructor
public class InternalStoreMirrorController {

    private final CloudStoreMirrorService mirrorService;

    @PutMapping
    public ResponseEntity<Void> upsert(@Valid @RequestBody InternalStoreUpsertRequest request) {
        mirrorService.upsert(request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{storeId}")
    public ResponseEntity<Void> deactivate(@PathVariable Integer storeId) {
        mirrorService.deactivate(storeId);
        return ResponseEntity.noContent().build();
    }
}
