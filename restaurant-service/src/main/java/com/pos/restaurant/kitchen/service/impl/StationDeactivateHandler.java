package com.pos.restaurant.kitchen.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.entity.KitchenStation;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StationDeactivateHandler {

    private final KitchenStationRepository stationRepository;
    private final FloorTenantSupport tenantSupport;

    @Transactional
    public void handle(UUID stationId) {
        Integer companyId = tenantSupport.requireCompanyId();
        KitchenStation station = stationRepository.findByIdAndCompanyId(stationId, companyId)
            .orElseThrow(() -> new NotFoundException("Kitchen station not found: " + stationId));
        station.setActive(false);
        LogUtil.info(StationDeactivateHandler.class, "Kitchen station deactivated: id={}", stationId);
    }
}
