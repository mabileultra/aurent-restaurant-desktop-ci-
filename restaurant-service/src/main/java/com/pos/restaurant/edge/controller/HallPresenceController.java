package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.dto.HallPresenceHeartbeatRequest;
import com.pos.restaurant.edge.service.HallPresenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Hall presence")
public class HallPresenceController {

    private final HallPresenceService hallPresenceService;

    @PostMapping("/rst/edge/hall-presence")
    @Operation(summary = "Hall PC heartbeat: cloud reachability + LAN hub URLs for phones")
    public ResponseEntity<Map<String, Object>> heartbeat(@RequestBody HallPresenceHeartbeatRequest body) {
        return ResponseEntity.ok(hallPresenceService.heartbeat(body));
    }

    @GetMapping("/rst/stores/{storeId}/hall-presence")
    @Operation(summary = "Phone poll: whether hall PC is cloud-reachable; if not, switchToLan + URLs")
    public ResponseEntity<Map<String, Object>> status(@PathVariable Integer storeId) {
        return ResponseEntity.ok(hallPresenceService.statusForStore(storeId));
    }
}
