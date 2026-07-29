package com.pos.crm.controller;

import com.pos.crm.repository.CustomerOrderRepository;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/crm/orders")
@RequiredArgsConstructor
@Hidden
public class CrmOrderInternalController {

    private final CustomerOrderRepository customerOrderRepository;

    @GetMapping("/exists-by-creator/{userId}")
    public boolean existsByCreator(@PathVariable UUID userId) {
        return customerOrderRepository.existsByCreatedById(userId);
    }

    @GetMapping("/count-by-store/{storeId}")
    public long countByStore(@PathVariable Integer storeId) {
        return customerOrderRepository.countByStoreId(storeId);
    }
}
