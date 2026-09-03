package com.pos.restaurant.shift.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.dto.CloseShiftRequest;
import com.pos.restaurant.shift.dto.ShiftResponse;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.support.ShiftClosePolicy;
import com.pos.restaurant.shift.support.ShiftLookup;
import com.pos.restaurant.shift.support.ShiftResponseAssembler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ShiftCloseHandler {

    private final ShiftLookup shiftLookup;
    private final FloorTenantSupport tenantSupport;
    private final ShiftClosePolicy closePolicy;
    private final ShiftResponseAssembler assembler;

    @Transactional
    public ShiftResponse handle(UUID shiftId, CloseShiftRequest request) {
        RestaurantShift shift = shiftLookup.require(shiftId);
        closePolicy.assertCanClose(shift);
        shift.setStatus(RestaurantShiftStatus.CLOSED);
        shift.setClosedAt(Instant.now());
        shift.setClosedByUserId(tenantSupport.requireUserId());
        shift.setClosingCash(request.closingCash());
        if (request.comment() != null && !request.comment().isBlank()) {
            shift.setComment(request.comment().trim());
        }
        LogUtil.info(ShiftCloseHandler.class, "Shift closed: id={}, storeId={}", shift.getId(), shift.getStoreId());
        return assembler.toResponse(shift, 0);
    }
}
