package com.pos.restaurant.kitchen.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.kitchen.entity.KitchenStation;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class KitchenStationLookup {

    private final KitchenStationRepository stationRepository;

    public KitchenStation requireActive(UUID stationId, Integer companyId, Integer storeId) {
        KitchenStation station = stationRepository.findByIdAndCompanyId(stationId, companyId)
            .orElseThrow(() -> new NotFoundException("Kitchen station not found: " + stationId));
        if (!station.getStoreId().equals(storeId) || !station.isActive()) {
            throw new BusinessException("Kitchen station is not available in this restaurant");
        }
        return station;
    }

    public UUID resolveOptional(UUID stationId, Integer companyId, Integer storeId) {
        if (stationId == null) {
            return null;
        }
        return requireActive(stationId, companyId, storeId).getId();
    }
}
