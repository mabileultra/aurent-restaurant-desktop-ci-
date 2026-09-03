package com.pos.restaurant.shift.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.dto.OpenShiftRequest;
import com.pos.restaurant.shift.dto.ShiftResponse;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.repository.RestaurantShiftRepository;
import com.pos.restaurant.shift.support.ShiftResponseAssembler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class ShiftOpenHandler {

    private final RestaurantShiftRepository shiftRepository;
    private final FloorTenantSupport tenantSupport;
    private final ShiftResponseAssembler assembler;

    @Transactional
    public ShiftResponse handle(Integer storeId, OpenShiftRequest request) {
        Integer companyId = tenantSupport.requireCompanyId();
        if (shiftRepository.existsByStoreIdAndStatus(storeId, RestaurantShiftStatus.OPEN)) {
            throw new BusinessException("Restaurant shift is already open");
        }
        BigDecimal openingCash = request.openingCash() == null ? BigDecimal.ZERO : request.openingCash();
        RestaurantShift saved = shiftRepository.save(RestaurantShift.builder()
            .companyId(companyId)
            .storeId(storeId)
            .status(RestaurantShiftStatus.OPEN)
            .openedByUserId(tenantSupport.requireUserId())
            .openingCash(openingCash)
            .comment(blankToNull(request.comment()))
            .build());
        LogUtil.info(ShiftOpenHandler.class, "Shift opened: id={}, storeId={}", saved.getId(), storeId);
        return assembler.toResponse(saved, 0);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
