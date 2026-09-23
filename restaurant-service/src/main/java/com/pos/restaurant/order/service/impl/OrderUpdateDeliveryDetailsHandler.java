package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateDeliveryDetailsRequest;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class OrderUpdateDeliveryDetailsHandler {

    private final FloorOrderItemRepository itemRepository;
    private final OrderLookup orderLookup;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(java.util.UUID orderId, UpdateDeliveryDetailsRequest request) {
        FloorOrder order = orderLookup.requireActive(orderId);
        if (order.getChannel() != OrderChannel.DELIVERY) {
            throw new BusinessException("Only delivery orders can update delivery details");
        }
        requireText(request.clientName(), "Client name is required");
        requireText(request.clientPhone(), "Client phone is required");
        requireText(request.deliveryAddress(), "Delivery address is required");

        order.setClientName(request.clientName().trim());
        order.setClientPhone(request.clientPhone().trim());
        order.setDeliveryAddress(request.deliveryAddress().trim());
        order.setComment(blankToNull(request.comment()));
        order.setCourierUserId(request.courierUserId());

        LogUtil.info(OrderUpdateDeliveryDetailsHandler.class, "Delivery details updated: id={}, courier={}",
            orderId, request.courierUserId());
        return assembler.toResponse(
            order,
            itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId)
        );
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
