package com.pos.pharmacy.controller;

import com.pos.pharmacy.security.PharmacyTenantContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/pharmacy")
public class PharmacyStatusController {

    @GetMapping("/status")
    public Map<String, Object> status() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service", "pharmacy-service");
        body.put("status", "UP");
        body.put("companyId", PharmacyTenantContext.getCompanyId());
        return body;
    }
}
