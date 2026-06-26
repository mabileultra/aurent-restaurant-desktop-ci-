package com.pos.restaurant.service;

import com.pos.restaurant.domain.KitchenTicketStatus;
import com.pos.restaurant.dto.KitchenTicketResponse;
import com.pos.restaurant.dto.TableSessionResponse;
import com.pos.restaurant.dto.UpdateKitchenTicketStatusRequest;

import java.util.List;
import java.util.UUID;

public interface KitchenTicketService {

    TableSessionResponse sendToKitchen(UUID sessionId, String kitchenDepartment);

    List<KitchenTicketResponse> listActiveTickets(Integer storeId, String kitchenDepartment);

    KitchenTicketResponse updateStatus(UUID ticketId, UpdateKitchenTicketStatusRequest request);
}
