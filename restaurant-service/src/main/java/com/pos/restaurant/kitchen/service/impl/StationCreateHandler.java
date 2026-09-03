package com.pos.restaurant.kitchen.service.impl;

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

@Component
@RequiredArgsConstructor
public class StationCreateHandler {

    private final KitchenStationRepository stationRepository;
    private final KitchenStationMapper stationMapper;
    private final FloorTenantSupport tenantSupport;
    private final StationCodeUniquenessValidator codeUniquenessValidator;

    @Transactional
    public StationResponse handle(Integer storeId, SaveStationRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        String code = request.code().trim().toUpperCase();
        codeUniquenessValidator.assertUniqueOnCreate(storeId, code);
        KitchenStation saved = stationRepository.save(KitchenStation.builder()
            .companyId(companyId)
            .storeId(storeId)
            .code(code)
            .name(request.name().trim())
            .sortOrder(request.sortOrder() == null ? 100 : request.sortOrder())
            .active(true)
            .build());
        LogUtil.info(StationCreateHandler.class, "Kitchen station created: id={}, storeId={}", saved.getId(), storeId);
        return stationMapper.toResponse(saved);
    }
}
