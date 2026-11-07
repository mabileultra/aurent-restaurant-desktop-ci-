package com.pos.restaurant.kitchen.service.impl;

import com.pos.restaurant.exception.BusinessException;
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
        KitchenStation inactive = inactiveSameCompany(storeId, companyId, code);
        if (inactive != null) {
            inactive.setName(request.name().trim());
            inactive.setSortOrder(request.sortOrder() == null ? 100 : request.sortOrder());
            inactive.setActive(true);
            KitchenStation saved = stationRepository.save(inactive);
            LogUtil.info(StationCreateHandler.class, "Kitchen station reactivated: id={}, storeId={}", saved.getId(), storeId);
            return stationMapper.toResponse(saved);
        }
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

    /** Выключенная станция не видна в списке, но код занят уникальным индексом. */
    private KitchenStation inactiveSameCompany(Integer storeId, Integer companyId, String code) {
        KitchenStation found = null;
        for (KitchenStation station : stationRepository.findByStoreIdAndCodeIgnoreCase(storeId, code)) {
            if (!companyId.equals(station.getCompanyId())) {
                throw new BusinessException("Station code already exists: " + code);
            }
            if (station.isActive()) {
                throw new BusinessException("Station code already exists: " + code);
            }
            found = station;
        }
        return found;
    }
}
