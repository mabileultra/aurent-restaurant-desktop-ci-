package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.DeliveryStatus;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OpenCounterOrderRequest;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.shift.support.ShiftLookup;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderOpenCounterHandler {

    private final FloorOrderRepository orderRepository;
    private final FloorTenantSupport tenantSupport;
    private final ShiftLookup shiftLookup;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(Integer storeId, OrderChannel channel, OpenCounterOrderRequest request) {
        if (channel != OrderChannel.TAKEAWAY && channel != OrderChannel.DELIVERY) {
            throw new BusinessException("Unsupported counter channel");
        }
        OpenCounterOrderRequest body = request == null
            ? new OpenCounterOrderRequest(null, null, null, null)
            : request;
        if (channel == OrderChannel.DELIVERY) {
            requireText(body.clientName(), "Client name is required");
            requireText(body.clientPhone(), "Client phone is required");
            requireText(body.deliveryAddress(), "Delivery address is required");
        }
        Integer companyId = tenantSupport.requireCompanyId();
        var shift = shiftLookup.requireOpen(storeId);
        var userId = tenantSupport.requireUserId();
        FloorOrder saved = orderRepository.save(FloorOrder.builder()
            .companyId(companyId)
            .storeId(storeId)
            .table(null)
            .channel(channel)
            .shift(shift)
            .orderNo(orderRepository.findMaxOrderNo(storeId) + 1)
            .status(OrderStatus.OPEN)
            .deliveryStatus(channel == OrderChannel.DELIVERY ? DeliveryStatus.NEW : null)
            .guestCount(1)
            .adultCount(1)
            .childrenCount(0)
            .clientName(blankToNull(body.clientName()))
            .clientPhone(blankToNull(body.clientPhone()))
            .deliveryAddress(blankToNull(body.deliveryAddress()))
            .openedByUserId(userId)
            .waiterUserId(userId)
            .comment(blankToNull(body.comment()))
            .build());
        LogUtil.info(OrderOpenCounterHandler.class, "Counter order opened: id={}, channel={}, storeId={}",
            saved.getId(), channel, storeId);
        return assembler.toResponse(saved, List.of());
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(message);
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
