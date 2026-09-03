package com.pos.restaurant.kitchen.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StationCodeUniquenessValidator {

    private final KitchenStationRepository stationRepository;

    public void assertUniqueOnCreate(Integer storeId, String code) {
        if (stationRepository.existsByStoreIdAndCodeIgnoreCaseAndActiveTrue(storeId, code)) {
            throw new BusinessException("Station code already exists: " + code);
        }
    }

    public void assertUniqueOnUpdate(Integer storeId, String code, UUID stationId) {
        if (stationRepository.existsByStoreIdAndCodeIgnoreCaseAndActiveTrueAndIdNot(storeId, code, stationId)) {
            throw new BusinessException("Station code already exists: " + code);
        }
    }
}
