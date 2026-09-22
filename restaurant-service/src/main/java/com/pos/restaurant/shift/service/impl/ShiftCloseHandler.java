package com.pos.restaurant.shift.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.dto.CloseShiftRequest;
import com.pos.restaurant.shift.dto.CloseShiftResult;
import com.pos.restaurant.shift.dto.ShiftReportResponse;
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
    private final BuildShiftReportHandler reportHandler;

    @Transactional
    public CloseShiftResult handle(UUID shiftId, CloseShiftRequest request) {
        RestaurantShift shift = shiftLookup.require(shiftId);
        closePolicy.assertCanClose(shift);
        Instant closedAt = Instant.now();
        shift.setStatus(RestaurantShiftStatus.CLOSED);
        shift.setClosedAt(closedAt);
        shift.setClosedByUserId(tenantSupport.requireUserId());
        shift.setClosingCash(request.closingCash());
        if (request.comment() != null && !request.comment().isBlank()) {
            shift.setComment(request.comment().trim());
        }
        ShiftReportResponse zReport = reportHandler.zReportOf(shift, null, null, closedAt);
        LogUtil.info(ShiftCloseHandler.class, "Shift closed: id={}, storeId={}", shift.getId(), shift.getStoreId());
        return new CloseShiftResult(assembler.toResponse(shift, 0), zReport);
    }
}
