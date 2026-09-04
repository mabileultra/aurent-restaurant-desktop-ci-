package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OpenOrderRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.support.GuestCountPolicy;
import com.pos.restaurant.order.support.GuestCounts;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.order.support.TableOpenPolicy;
import com.pos.restaurant.booking.service.ReservationSeatOnOpenService;
import com.pos.restaurant.shift.support.ShiftLookup;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderOpenHandler {

    private final FloorOrderRepository orderRepository;
    private final FloorEntityLookup entityLookup;
    private final FloorTenantSupport tenantSupport;
    private final GuestCountPolicy guestCountPolicy;
    private final TableOpenPolicy tableOpenPolicy;
    private final ShiftLookup shiftLookup;
    private final ReservationSeatOnOpenService reservationSeatOnOpenService;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(Integer tableId, OpenOrderRequest request) {
        FloorTable table = entityLookup.requireTable(tableId);
        tableOpenPolicy.assertCanOpen(table.getStatus());
        if (orderRepository.existsByTableIdAndStatusIn(tableId, List.of(OrderStatus.OPEN, OrderStatus.BILLING))) {
            throw new BusinessException("Table already has an open order");
        }
        var shift = shiftLookup.requireOpen(table.getStoreId());
        GuestCounts guests = guestCountPolicy.normalize(
            request.guestCount(),
            request.adultCount(),
            request.childrenCount()
        );
        var userId = tenantSupport.requireUserId();
        FloorOrder saved = orderRepository.save(FloorOrder.builder()
            .companyId(table.getCompanyId())
            .storeId(table.getStoreId())
            .table(table)
            .channel(OrderChannel.DINE_IN)
            .shift(shift)
            .orderNo(orderRepository.findMaxOrderNo(table.getStoreId()) + 1)
            .status(OrderStatus.OPEN)
            .guestCount(guests.guestCount())
            .adultCount(guests.adultCount())
            .childrenCount(guests.childrenCount())
            .openedByUserId(userId)
            .waiterUserId(userId)
            .comment(blankToNull(request.comment()))
            .build());
        table.setStatus(TableStatus.OCCUPIED);
        reservationSeatOnOpenService.markSeatedForTable(tableId);
        LogUtil.info(OrderOpenHandler.class, "Order opened: id={}, tableId={}", saved.getId(), tableId);
        return assembler.toResponse(saved, List.of());
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
