package com.pos.controller.internal;

import com.pos.dto.identity.internal.CompanyRefDto;
import com.pos.dto.identity.internal.IdentityAuditRequest;
import com.pos.dto.identity.internal.StoreValidateRequest;
import com.pos.dto.identity.internal.StoreValidateResponse;
import com.pos.dto.identity.internal.SuperAdminLoginEmailRequest;
import com.pos.dto.identity.internal.UserCredentialsEmailRequest;
import com.pos.dto.identity.internal.UserSyncRequest;
import com.pos.service.identity.IdentityInternalService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/identity")
@RequiredArgsConstructor
@Hidden
public class IdentityInternalController {

    private final IdentityInternalService identityInternalService;

    @GetMapping("/companies/by-login-code/{code}")
    public ResponseEntity<CompanyRefDto> companyByLoginCode(@PathVariable String code) {
        return ResponseEntity.ok(identityInternalService.companyByLoginCode(code));
    }

    @GetMapping("/companies/{id}")
    public ResponseEntity<CompanyRefDto> companyById(@PathVariable Integer id) {
        return ResponseEntity.ok(identityInternalService.companyById(id));
    }

    @PostMapping("/users/sync")
    public ResponseEntity<Void> syncUser(@RequestBody UserSyncRequest request) {
        identityInternalService.syncUser(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/audit")
    public ResponseEntity<Void> audit(@RequestBody IdentityAuditRequest request) {
        identityInternalService.audit(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/email/super-admin-login")
    public ResponseEntity<Void> superAdminLoginEmail(@RequestBody SuperAdminLoginEmailRequest request) {
        identityInternalService.notifySuperAdminLogin(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/email/user-credentials")
    public ResponseEntity<Void> userCredentialsEmail(@RequestBody UserCredentialsEmailRequest request) {
        identityInternalService.sendUserCredentials(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/stores/validate")
    public ResponseEntity<StoreValidateResponse> validateStores(@RequestBody StoreValidateRequest request) {
        return ResponseEntity.ok(identityInternalService.validateStores(request));
    }
}
