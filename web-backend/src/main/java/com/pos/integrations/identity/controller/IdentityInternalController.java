package com.pos.integrations.identity.controller;

import com.pos.dto.identity.internal.CompanyDirectoryItem;
import com.pos.dto.identity.internal.CompanyRefDto;
import com.pos.dto.identity.internal.IdListRequest;
import com.pos.dto.identity.internal.IdentityAuditRequest;
import com.pos.dto.identity.internal.StoreNameItem;
import com.pos.dto.identity.internal.StoreValidateRequest;
import com.pos.dto.identity.internal.StoreValidateResponse;
import com.pos.dto.identity.internal.SuperAdminLoginEmailRequest;
import com.pos.dto.identity.internal.UserCredentialsEmailRequest;
import com.pos.dto.identity.internal.UserSyncRequest;
import com.pos.service.identity.IdentityCompanyDirectoryService;
import com.pos.service.identity.IdentityInternalService;
import com.pos.service.identity.IdentityStoreNameService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/internal/identity")
@RequiredArgsConstructor
@Hidden
public class IdentityInternalController {

    private final IdentityInternalService identityInternalService;
    private final IdentityCompanyDirectoryService companyDirectoryService;
    private final IdentityStoreNameService storeNameService;

    @GetMapping("/companies/ids")
    public List<Integer> companyIds(
        @RequestParam(required = false) String businessType,
        @RequestParam(required = false) String regionCode,
        @RequestParam(required = false) String districtCode
    ) {
        return companyDirectoryService.findIds(businessType, regionCode, districtCode);
    }

    @GetMapping("/companies/search-ids")
    public List<Integer> companySearchIds(@RequestParam(required = false) String search) {
        return companyDirectoryService.findIdsBySearch(search);
    }

    @PostMapping("/companies/by-ids")
    public List<CompanyDirectoryItem> companiesByIds(@RequestBody IdListRequest request) {
        return companyDirectoryService.findByIds(request == null ? List.of() : request.ids());
    }

    @GetMapping("/stores/search-ids")
    public List<Integer> storeSearchIds(@RequestParam(required = false) String search) {
        return storeNameService.findIdsBySearch(search);
    }

    @PostMapping("/stores/names")
    public List<StoreNameItem> storeNames(@RequestBody IdListRequest request) {
        return storeNameService.findByIds(request == null ? List.of() : request.ids());
    }

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
