package com.pos.restaurant.floor.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TableCodeUniquenessValidator {

    private final FloorTableRepository tableRepository;

    public void assertUniqueOnCreate(Integer hallId, String code) {
        if (tableRepository.existsByHallIdAndCodeIgnoreCaseAndActiveTrue(hallId, code)) {
            throw new BusinessException("Table code already exists: " + code);
        }
    }

    public void assertUniqueOnUpdate(Integer hallId, String code, Integer tableId) {
        if (tableRepository.existsByHallIdAndCodeIgnoreCaseAndActiveTrueAndIdNot(hallId, code, tableId)) {
            throw new BusinessException("Table code already exists: " + code);
        }
    }
}
