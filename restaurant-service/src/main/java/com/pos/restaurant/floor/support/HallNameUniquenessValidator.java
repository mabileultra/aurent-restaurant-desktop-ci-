package com.pos.restaurant.floor.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.repository.FloorHallRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HallNameUniquenessValidator {

    private final FloorHallRepository hallRepository;

    public void assertUniqueOnCreate(Integer companyId, Integer storeId, String name) {
        if (hallRepository.existsByCompanyIdAndStoreIdAndNameIgnoreCaseAndActiveTrue(companyId, storeId, name)) {
            throw new BusinessException("Hall name already exists: " + name);
        }
    }

    public void assertUniqueOnUpdate(Integer companyId, Integer storeId, String name, Integer hallId) {
        if (hallRepository.existsByCompanyIdAndStoreIdAndNameIgnoreCaseAndActiveTrueAndIdNot(
            companyId, storeId, name, hallId
        )) {
            throw new BusinessException("Hall name already exists: " + name);
        }
    }
}
