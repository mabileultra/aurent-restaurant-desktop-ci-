package com.pos.restaurant.shift.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.shift.dto.CloseShiftRequest;
import com.pos.restaurant.shift.dto.OpenShiftRequest;
import com.pos.restaurant.shift.dto.ShiftResponse;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.repository.RestaurantShiftRepository;
import com.pos.restaurant.shift.service.RestaurantShiftService;
import com.pos.restaurant.shift.support.ShiftClosePolicy;
import com.pos.restaurant.shift.support.ShiftLookup;
import com.pos.restaurant.shift.support.ShiftResponseAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RestaurantShiftServiceImpl implements RestaurantShiftService {

    private final RestaurantShiftRepository shiftRepository;
    private final FloorTenantSupport tenantSupport;
    private final ShiftLookup shiftLookup;
    private final ShiftClosePolicy closePolicy;
    private final ShiftResponseAssembler assembler;
    private final ShiftOpenHandler openHandler;
    private final ShiftCloseHandler closeHandler;

    @Override
    @Transactional(readOnly = true)
    public Optional<ShiftResponse> findCurrent(Integer storeId) {
        return shiftLookup.findOpen(storeId)
            .map(shift -> assembler.toResponse(shift, closePolicy.openOrderCount(shift.getId())));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftResponse> list(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        List<RestaurantShift> shifts = shiftRepository.findByCompanyIdAndStoreIdOrderByOpenedAtDesc(companyId, storeId);
        return shifts.stream()
            .map(shift -> assembler.toResponse(shift, closePolicy.openOrderCount(shift.getId())))
            .toList();
    }

    @Override
    public ShiftResponse open(Integer storeId, OpenShiftRequest request) {
        return openHandler.handle(storeId, request);
    }

    @Override
    public ShiftResponse close(UUID shiftId, CloseShiftRequest request) {
        return closeHandler.handle(shiftId, request);
    }
}
