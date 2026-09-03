package com.pos.restaurant.shift.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.repository.RestaurantShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ShiftLookup {

    private final RestaurantShiftRepository shiftRepository;
    private final FloorTenantSupport tenantSupport;

    public Optional<RestaurantShift> findOpen(Integer storeId) {
        return shiftRepository.findByStoreIdAndStatus(storeId, RestaurantShiftStatus.OPEN)
            .map(this::assertCompany);
    }

    public RestaurantShift requireOpen(Integer storeId) {
        return findOpen(storeId)
            .orElseThrow(() -> new BusinessException("Restaurant shift is not open"));
    }

    public RestaurantShift require(UUID shiftId) {
        RestaurantShift shift = shiftRepository.findById(shiftId)
            .orElseThrow(() -> new NotFoundException("Restaurant shift not found"));
        return assertCompany(shift);
    }

    private RestaurantShift assertCompany(RestaurantShift shift) {
        tenantSupport.assertCompany(shift.getCompanyId());
        return shift;
    }
}
