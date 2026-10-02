package com.pos.restaurant.shift.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.dto.ShiftReportResponse;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.support.ShiftItemSalesLoader;
import com.pos.restaurant.shift.support.ShiftLookup;
import com.pos.restaurant.shift.support.ShiftReportAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class BuildShiftReportHandler {

    private final ShiftLookup shiftLookup;
    private final FloorOrderRepository orderRepository;
    private final ShiftReportAssembler reportAssembler;
    private final ShiftItemSalesLoader itemSalesLoader;

    @Transactional(readOnly = true)
    public ShiftReportResponse xReport(UUID shiftId, String storeName, String cashierName) {
        RestaurantShift shift = shiftLookup.require(shiftId);
        if (shift.getStatus() != RestaurantShiftStatus.OPEN) {
            throw new BusinessException("X-отчёт доступен только для открытой смены");
        }
        return build("X", shift, storeName, cashierName, Instant.now());
    }

    @Transactional(readOnly = true)
    public ShiftReportResponse zPreview(UUID shiftId, String storeName, String cashierName) {
        RestaurantShift shift = shiftLookup.require(shiftId);
        if (shift.getStatus() != RestaurantShiftStatus.OPEN) {
            throw new BusinessException("Z-отчёт доступен только для открытой смены");
        }
        return build("Z", shift, storeName, cashierName, Instant.now());
    }

    public ShiftReportResponse zReportOf(RestaurantShift shift, String storeName, String cashierName, Instant reportAt) {
        return build("Z", shift, storeName, cashierName, reportAt);
    }

    private ShiftReportResponse build(
        String type,
        RestaurantShift shift,
        String storeName,
        String cashierName,
        Instant reportAt
    ) {
        return reportAssembler.toReport(
            type,
            shift,
            storeName,
            cashierName,
            reportAt,
            returnsCount(shift.getId()),
            itemSalesLoader.load(shift, reportAt)
        );
    }

    private int returnsCount(UUID shiftId) {
        return (int) orderRepository.countByShiftIdAndStatusIn(shiftId, List.of(OrderStatus.REFUNDED));
    }
}
