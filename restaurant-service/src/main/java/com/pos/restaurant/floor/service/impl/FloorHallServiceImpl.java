package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.floor.dto.HallResponse;
import com.pos.restaurant.floor.dto.SaveHallRequest;
import com.pos.restaurant.floor.mapper.FloorHallMapper;
import com.pos.restaurant.floor.repository.FloorHallRepository;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.revision.FloorRevisionBump;
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
    private final FloorRevisionBump floorRevision;

    @Override
    public List<HallResponse> listByStore(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return hallRepository.findByCompanyIdAndStoreIdOrderBySortOrderAscNameAsc(companyId, storeId).stream()
            .map(hall -> hallMapper.toResponse(hall, tableRepository.countByHallIdAndActiveTrue(hall.getId())))
            .toList();
    }

    @Override
    @Transactional
    public HallResponse create(Integer storeId, SaveHallRequest request) {
        HallResponse response = createHandler.handle(storeId, request);
        bumpHall(response.id());
        return response;
    }

    @Override
    @Transactional
    public HallResponse update(Integer hallId, SaveHallRequest request) {
        HallResponse response = updateHandler.handle(hallId, request);
        bumpHall(hallId);
        return response;
    }

    @Override
    @Transactional
    public void deactivate(Integer hallId) {
        deactivateHandler.handle(hallId);
        bumpHall(hallId);
    }

    private void bumpHall(Integer hallId) {
        hallRepository.findById(hallId).ifPresent(hall -> floorRevision.bump(hall.getCompanyId(), hall.getStoreId()));
    }
}
