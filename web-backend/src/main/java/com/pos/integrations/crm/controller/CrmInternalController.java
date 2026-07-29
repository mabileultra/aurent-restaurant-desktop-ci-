package com.pos.integrations.crm.controller;

import com.pos.dto.crm.internal.CustomerSyncRequest;
import com.pos.service.crm.CrmCustomerSyncService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/crm")
@RequiredArgsConstructor
@Hidden
public class CrmInternalController {

    private final CrmCustomerSyncService crmCustomerSyncService;

    @PostMapping("/customers/sync")
    public ResponseEntity<Void> syncCustomer(@RequestBody CustomerSyncRequest request) {
        crmCustomerSyncService.sync(request);
        return ResponseEntity.noContent().build();
    }
}
