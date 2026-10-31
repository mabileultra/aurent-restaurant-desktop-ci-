package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.dto.EdgeAuthResponse;
import com.pos.restaurant.edge.dto.EdgeCloudPinUpsertRequest;
import com.pos.restaurant.edge.dto.EdgeLoginRequest;
import com.pos.restaurant.edge.dto.EdgePinLoginRequest;
import com.pos.restaurant.edge.dto.EdgePinRosterEntry;
import com.pos.restaurant.edge.dto.EdgeStaffBootstrapRequest;
import com.pos.restaurant.edge.service.EdgeAuthService;
import com.pos.restaurant.edge.support.EdgeStaffLocalExporter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Edge-only auth under the same paths the restaurant UI already calls
 * ({@code /auth/login}, PIN roster). Active only when {@code app.restaurant.edge.enabled=true}.
 */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
@Tag(name = "Edge auth")
public class EdgeAuthController {

    private final EdgeAuthService edgeAuthService;
    private final EdgeStaffLocalExporter staffLocalExporter;

    @PostMapping("/auth/login")
    @Operation(summary = "Local password login (edge)")
    public ResponseEntity<EdgeAuthResponse> login(@Valid @RequestBody EdgeLoginRequest request) {
        return ResponseEntity.ok(edgeAuthService.login(request));
    }

    @PostMapping("/auth/refresh")
    @Operation(summary = "Re-issue local JWT (edge)")
    public ResponseEntity<EdgeAuthResponse> refresh(
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return ResponseEntity.ok(edgeAuthService.refresh(authorization));
    }

    @GetMapping("/auth/cashier-pin/roster")
    @Operation(summary = "Local PIN roster (edge)")
    public ResponseEntity<List<EdgePinRosterEntry>> roster(
        @RequestParam(required = false) String companyLoginCode
    ) {
        return ResponseEntity.ok(edgeAuthService.pinRoster(companyLoginCode));
    }

    @PostMapping("/auth/cashier-pin/login")
    @Operation(summary = "Local PIN login (edge)")
    public ResponseEntity<EdgeAuthResponse> pinLogin(@Valid @RequestBody EdgePinLoginRequest request) {
        return ResponseEntity.ok(edgeAuthService.pinLogin(request));
    }

    @PostMapping("/edge/auth/bootstrap-staff")
    @Operation(summary = "Import/replace local staff copy after online bootstrap")
    public ResponseEntity<Map<String, Object>> bootstrap(@Valid @RequestBody EdgeStaffBootstrapRequest request) {
        int saved = edgeAuthService.bootstrap(request);
        return ResponseEntity.ok(Map.of("saved", saved, "hasStaff", edgeAuthService.hasStaff()));
    }

    @PostMapping("/edge/auth/upsert-cloud-pin")
    @Operation(summary = "Upsert one staff row after Electron verified PIN on cloud")
    public ResponseEntity<EdgeAuthResponse> upsertCloudPin(@Valid @RequestBody EdgeCloudPinUpsertRequest request) {
        return ResponseEntity.ok(edgeAuthService.upsertFromCloudPin(request));
    }

    @GetMapping("/edge/auth/status")
    @Operation(summary = "Whether local staff is bootstrapped")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
            "edge", true,
            "hasStaff", edgeAuthService.hasStaff()
        ));
    }

    @GetMapping("/edge/auth/staff-export")
    @Operation(summary = "Export local staff hashes for cloud ingest (S2b)")
    public ResponseEntity<Map<String, Object>> staffExport(
        @RequestParam(required = false) Integer companyId
    ) {
        return ResponseEntity.ok(staffLocalExporter.exportForCompany(companyId));
    }
}
