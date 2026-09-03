package com.pos.restaurant.kitchen.support;

import com.pos.restaurant.kitchen.dto.KitchenTicketLineResponse;
import com.pos.restaurant.kitchen.dto.KitchenTicketResponse;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import com.pos.restaurant.kitchen.entity.KitchenTicketLine;
import com.pos.restaurant.order.entity.FloorOrderItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class KitchenTicketAssembler {

    public KitchenTicketResponse toResponse(KitchenTicket ticket, List<KitchenTicketLine> lines) {
        UUID stationId = ticket.getStation() == null ? null : ticket.getStation().getId();
        String stationName = ticket.getStation() == null ? null : ticket.getStation().getName();
        return new KitchenTicketResponse(
            ticket.getId(),
            ticket.getOrder().getId(),
            ticket.getOrder().getOrderNo(),
            ticket.getOrder().getTable().getId(),
            ticket.getOrder().getTable().getCode(),
            stationId,
            stationName,
            ticket.getStatus(),
            ticket.getSentAt(),
            lines.stream().map(this::toLine).toList()
        );
    }

    private KitchenTicketLineResponse toLine(KitchenTicketLine line) {
        FloorOrderItem item = line.getOrderItem();
        return new KitchenTicketLineResponse(
            item.getId(),
            item.getName(),
            item.getQuantity(),
            item.getNote()
        );
    }
}
