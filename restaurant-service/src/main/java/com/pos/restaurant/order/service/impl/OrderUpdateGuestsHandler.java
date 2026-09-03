package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateGuestsRequest;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.GuestCountPolicy;
import com.pos.restaurant.order.support.GuestCounts;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderUpdateGuestsHandler {

    private final FloorOrderItemRepository itemRepository;
    private final OrderLookup orderLookup;
    private final GuestCountPolicy guestCountPolicy;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(UUID orderId, UpdateGuestsRequest request) {
        FloorOrder order = orderLookup.requireOpen(orderId);
        GuestCounts guests = guestCountPolicy.normalize(
            request.guestCount(),
            request.adultCount(),
            request.childrenCount()
        );
        order.setGuestCount(guests.guestCount());
        order.setAdultCount(guests.adultCount());
        order.setChildrenCount(guests.childrenCount());
        return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId));
    }
}
