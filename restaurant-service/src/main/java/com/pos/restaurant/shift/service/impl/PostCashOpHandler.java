package com.pos.restaurant.shift.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.shift.dto.CashOpRequest;
import com.pos.restaurant.shift.dto.CashOpResponse;
import com.pos.restaurant.shift.entity.RestaurantCashOp;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.repository.RestaurantCashOpRepository;
import com.pos.restaurant.shift.support.CashOpPolicy;
import com.pos.restaurant.shift.support.ShiftCashMath;
import com.pos.restaurant.shift.support.ShiftCashOpTotalsLoader;
import com.pos.restaurant.shift.support.ShiftLookup;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PostCashOpHandler {

    private final ShiftLookup shiftLookup;
    private final FloorTenantSupport tenantSupport;
    private final RestaurantCashOpRepository cashOpRepository;
    private final ShiftCashOpTotalsLoader totalsLoader;

    @Transactional
    public CashOpResponse handle(UUID shiftId, CashOpRequest request) {
        RestaurantShift shift = shiftLookup.require(shiftId);
        ShiftCashMath.Drawer drawer = totalsLoader.totals(shiftId);
        CashOpPolicy.assertCanPost(shift, request, drawer);
        RestaurantCashOp saved = cashOpRepository.save(RestaurantCashOp.builder()
            .companyId(shift.getCompanyId())
            .storeId(shift.getStoreId())
            .shift(shift)
            .type(request.type())
            .amount(ShiftCashMath.money(request.amount()))
            .comment(CashOpPolicy.comment(request))
            .createdByUserId(tenantSupport.requireUserId())
            .build());
        LogUtil.info(PostCashOpHandler.class, "Cash op {} {} on shift {}", saved.getType(), saved.getAmount(), shiftId);
        return toResponse(saved);
    }

    static CashOpResponse toResponse(RestaurantCashOp op) {
        return new CashOpResponse(
            op.getId(),
            op.getShift().getId(),
            op.getType(),
            op.getAmount(),
            op.getComment(),
            op.getCreatedByUserId(),
            op.getCreatedAt()
        );
    }
}
