package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.floor.dto.HallResponse;
import com.pos.restaurant.floor.dto.SaveHallRequest;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.mapper.FloorHallMapper;
import com.pos.restaurant.floor.repository.FloorHallRepository;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.floor.support.HallNameUniquenessValidator;
import com.pos.restaurant.floor.support.ServicePercentRules;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class HallCreateHandler {

    private final FloorHallRepository hallRepository;
    private final FloorHallMapper hallMapper;
    private final FloorTenantSupport tenantSupport;
    private final HallNameUniquenessValidator nameUniquenessValidator;

    @Transactional
    public HallResponse handle(Integer storeId, SaveHallRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        String name = request.name().trim();
        nameUniquenessValidator.assertUniqueOnCreate(companyId, storeId, name);
        FloorHall saved = hallRepository.save(FloorHall.builder()
            .companyId(companyId)
            .storeId(storeId)
            .name(name)
            .sortOrder(request.sortOrder())
            .servicePercent(ServicePercentRules.required(request.servicePercent()))
            .active(true)
            .build());
        LogUtil.info(HallCreateHandler.class, "Hall created: id={}, storeId={}", saved.getId(), storeId);
        return hallMapper.toResponse(saved, 0);
    }
}
