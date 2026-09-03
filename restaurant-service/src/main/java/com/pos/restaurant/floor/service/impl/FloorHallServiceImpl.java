package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.floor.dto.HallResponse;
import com.pos.restaurant.floor.dto.SaveHallRequest;
import com.pos.restaurant.floor.mapper.FloorHallMapper;
import com.pos.restaurant.floor.repository.FloorHallRepository;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.service.FloorHallService;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FloorHallServiceImpl implements FloorHallService {

    private final FloorHallRepository hallRepository;
    private final FloorTableRepository tableRepository;
    private final FloorHallMapper hallMapper;
    private final FloorTenantSupport tenantSupport;
    private final HallCreateHandler createHandler;
    private final HallUpdateHandler updateHandler;
    private final HallDeactivateHandler deactivateHandler;

    @Override
    public List<HallResponse> listByStore(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return hallRepository.findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId).stream()
            .map(hall -> hallMapper.toResponse(hall, tableRepository.countByHallIdAndActiveTrue(hall.getId())))
            .toList();
    }

    @Override
    public HallResponse create(Integer storeId, SaveHallRequest request) {
        return createHandler.handle(storeId, request);
    }

    @Override
    public HallResponse update(Integer hallId, SaveHallRequest request) {
        return updateHandler.handle(hallId, request);
    }

    @Override
    public void deactivate(Integer hallId) {
        deactivateHandler.handle(hallId);
    }
}
