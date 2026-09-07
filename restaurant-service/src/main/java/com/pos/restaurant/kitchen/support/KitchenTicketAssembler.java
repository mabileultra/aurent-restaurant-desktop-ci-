package com.pos.restaurant.kitchen.support;

import com.pos.restaurant.kitchen.dto.KitchenTicketLineResponse;
import com.pos.restaurant.kitchen.dto.KitchenTicketResponse;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import com.pos.restaurant.kitchen.entity.KitchenTicketLine;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.entity.FloorOrderItemModifier;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class KitchenTicketAssembler {

    public KitchenTicketResponse toResponse(
        KitchenTicket ticket,
        List<KitchenTicketLine> lines,
        Map<UUID, List<FloorOrderItemModifier>> modifiersByItem
    ) {
        UUID stationId = ticket.getStation() == null ? null : ticket.getStation().getId();
        String stationName = ticket.getStation() == null ? null : ticket.getStation().getName();
        FloorOrder order = ticket.getOrder();
        OrderChannel channel = order.getChannel() == null ? OrderChannel.DINE_IN : order.getChannel();
        Integer tableId = order.getTable() == null ? null : order.getTable().getId();
        String tableCode = order.getTable() == null
            ? OrderResponseAssembler.displayCode(channel, order)
            : order.getTable().getCode();
        String hallName = order.getTable() == null || order.getTable().getHall() == null
            ? null
            : order.getTable().getHall().getName();
        return new KitchenTicketResponse(
            ticket.getId(),
            order.getId(),
            order.getOrderNo(),
            channel,
            tableId,
            tableCode,
            hallName,
            order.getWaiterUserId(),
            order.getClientName(),
            stationId,
            stationName,
            ticket.getStatus(),
            ticket.getSentAt(),
            lines.stream().map(line -> toLine(line, modifiersByItem)).toList()
        );
    }

    private KitchenTicketLineResponse toLine(
        KitchenTicketLine line,
        Map<UUID, List<FloorOrderItemModifier>> modifiersByItem
    ) {
        FloorOrderItem item = line.getOrderItem();
        List<String> modifiers = modifiersByItem.getOrDefault(item.getId(), List.of()).stream()
            .map(FloorOrderItemModifier::getName)
            .toList();
        return new KitchenTicketLineResponse(
            item.getId(),
            item.getName(),
            item.getQuantity(),
            item.getNote(),
            modifiers
        );
    }
}
