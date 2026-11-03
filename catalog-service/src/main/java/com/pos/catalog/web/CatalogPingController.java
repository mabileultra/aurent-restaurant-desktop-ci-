package com.pos.catalog.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/catalog")
public class CatalogPingController {

    @GetMapping("/ping")
    public Map<String, String> ping() {
        return Map.of(
            "service", "catalog-service",
            "status", "UP",
            "wave", "3.3"
        );
    }
}
