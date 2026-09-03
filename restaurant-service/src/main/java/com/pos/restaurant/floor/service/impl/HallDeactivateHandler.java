package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class HallDeactivateHandler {

    private final FloorTableRepository tableRepository;
    private final FloorEntityLookup entityLookup;

    @Transactional
    public void handle(Integer hallId) {
        FloorHall hall = entityLookup.requireHall(hallId);
        if (tableRepository.existsByHallIdAndActiveTrue(hallId)) {
            throw new BusinessException("Deactivate tables before deactivating the hall");
        }
        hall.setActive(false);
        LogUtil.info(HallDeactivateHandler.class, "Hall deactivated: id={}", hallId);
    }
}
