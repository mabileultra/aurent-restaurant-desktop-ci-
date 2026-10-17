package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.service.EdgeCloudSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Edge sync (local)")
public class EdgeSyncController {

    private final ObjectProvider<EdgeCloudSyncService> syncService;

    @GetMapping("/edge/sync/status")
    @Operation(summary = "Pending outbox counts for status strip")
    public ResponseEntity<Map<String, Object>> status() {
        EdgeCloudSyncService sync = syncService.getIfAvailable();
        if (sync == null) {
            return ResponseEntity.ok(Map.of("edge", false, "pending", 0, "failed", 0));
        }
        Map<String, Object> body = sync.status();
        body.put("edge", true);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/edge/sync/push")
    @Operation(summary = "Push PENDING outbox events to cloud ingest")
    public ResponseEntity<Map<String, Object>> push() {
        EdgeCloudSyncService sync = syncService.getIfAvailable();
        if (sync == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Edge mode is not enabled"));
        }
        return ResponseEntity.ok(sync.pushPendingBatch());
    }
}
