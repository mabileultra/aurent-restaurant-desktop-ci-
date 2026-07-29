package com.pos.integrations.crm.controller;

import com.pos.dto.crm.internal.CourierRefDto;
import com.pos.dto.crm.internal.CustomerSyncRequest;
import com.pos.dto.crm.internal.StoreRefDto;
import com.pos.service.crm.CrmCustomerSyncService;
import com.pos.service.crm.CrmDirectoryService;
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
@RequestMapping("/internal/crm")
@RequiredArgsConstructor
@Hidden
public class CrmInternalController {

    private final CrmCustomerSyncService crmCustomerSyncService;
    private final CrmDirectoryService crmDirectoryService;

    @PostMapping("/customers/sync")
    public ResponseEntity<Void> syncCustomer(@RequestBody CustomerSyncRequest request) {
        crmCustomerSyncService.sync(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stores/{id}")
    public ResponseEntity<StoreRefDto> getStore(@PathVariable Integer id) {
        return ResponseEntity.ok(crmDirectoryService.getStore(id));
    }

    @GetMapping("/couriers")
    public ResponseEntity<List<CourierRefDto>> listCouriers(@RequestParam Integer companyId) {
        return ResponseEntity.ok(crmDirectoryService.listCouriers(companyId));
    }
}
