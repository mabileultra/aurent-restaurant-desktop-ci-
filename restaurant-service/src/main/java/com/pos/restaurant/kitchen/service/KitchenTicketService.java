package com.pos.restaurant.kitchen.service;

import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.kitchen.dto.KitchenTicketResponse;
import com.pos.restaurant.order.dto.OrderResponse;

import java.util.List;
import java.util.UUID;

public interface KitchenTicketService {

    OrderResponse send(UUID orderId);

    List<KitchenTicketResponse> listBoard(Integer storeId, UUID stationId);

    KitchenTicketResponse updateStatus(UUID ticketId, KitchenTicketStatus status);
}
