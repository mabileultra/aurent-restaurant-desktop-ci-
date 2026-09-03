package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.floor.dto.HallResponse;
import com.pos.restaurant.floor.dto.SaveHallRequest;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.mapper.FloorHallMapper;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.restaurant.floor.support.HallNameUniquenessValidator;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class HallUpdateHandler {

    private final FloorHallMapper hallMapper;
    private final FloorTableRepository tableRepository;
    private final FloorEntityLookup entityLookup;
    private final HallNameUniquenessValidator nameUniquenessValidator;

    @Transactional
    public HallResponse handle(Integer hallId, SaveHallRequest request) {
        FloorHall hall = entityLookup.requireHall(hallId);
        String name = request.name().trim();
        nameUniquenessValidator.assertUniqueOnUpdate(hall.getCompanyId(), hall.getStoreId(), name, hallId);
        hall.setName(name);
        hall.setSortOrder(request.sortOrder());
        LogUtil.info(HallUpdateHandler.class, "Hall updated: id={}", hallId);
        return hallMapper.toResponse(hall, tableRepository.countByHallIdAndActiveTrue(hallId));
    }
}
