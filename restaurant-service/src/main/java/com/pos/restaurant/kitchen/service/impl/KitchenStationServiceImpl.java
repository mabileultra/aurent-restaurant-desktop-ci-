package com.pos.restaurant.kitchen.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.dto.SaveStationRequest;
import com.pos.restaurant.kitchen.dto.StationResponse;
import com.pos.restaurant.kitchen.mapper.KitchenStationMapper;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.restaurant.kitchen.service.KitchenStationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KitchenStationServiceImpl implements KitchenStationService {

    private final KitchenStationRepository stationRepository;
    private final KitchenStationMapper stationMapper;
    private final FloorTenantSupport tenantSupport;
    private final StationCreateHandler createHandler;
    private final StationUpdateHandler updateHandler;
    private final StationDeactivateHandler deactivateHandler;

    @Override
    public List<StationResponse> list(Integer storeId, boolean activeOnly) {
        Integer companyId = tenantSupport.requireCompanyId();
        var rows = activeOnly
            ? stationRepository.findByCompanyIdAndStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(companyId, storeId)
            : stationRepository.findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId);
        return rows.stream().map(stationMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public StationResponse create(Integer storeId, SaveStationRequest request) {
        return createHandler.handle(storeId, request);
    }

    @Override
    @Transactional
    public StationResponse update(UUID stationId, SaveStationRequest request) {
        return updateHandler.handle(stationId, request);
    }

    @Override
    @Transactional
    public void deactivate(UUID stationId) {
        deactivateHandler.handle(stationId);
    }
}
