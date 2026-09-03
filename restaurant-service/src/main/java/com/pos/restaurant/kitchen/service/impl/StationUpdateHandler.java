package com.pos.restaurant.kitchen.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.dto.SaveStationRequest;
import com.pos.restaurant.kitchen.dto.StationResponse;
import com.pos.restaurant.kitchen.entity.KitchenStation;
import com.pos.restaurant.kitchen.mapper.KitchenStationMapper;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.restaurant.kitchen.support.StationCodeUniquenessValidator;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StationUpdateHandler {

    private final KitchenStationRepository stationRepository;
    private final KitchenStationMapper stationMapper;
    private final FloorTenantSupport tenantSupport;
    private final StationCodeUniquenessValidator codeUniquenessValidator;

    @Transactional
    public StationResponse handle(UUID stationId, SaveStationRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        KitchenStation station = stationRepository.findByIdAndCompanyId(stationId, companyId)
            .orElseThrow(() -> new NotFoundException("Kitchen station not found: " + stationId));
        String code = request.code().trim().toUpperCase();
        codeUniquenessValidator.assertUniqueOnUpdate(station.getStoreId(), code, stationId);
        station.setCode(code);
        station.setName(request.name().trim());
        if (request.sortOrder() != null) {
            station.setSortOrder(request.sortOrder());
        }
        LogUtil.info(StationUpdateHandler.class, "Kitchen station updated: id={}", stationId);
        return stationMapper.toResponse(station);
    }
}
