package com.pos.restaurant.kitchen.support;

import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.order.domain.OrderItemStatus;
import org.springframework.stereotype.Component;

@Component
public class KitchenItemStatusMapper {

    public OrderItemStatus toItemStatus(KitchenTicketStatus ticketStatus) {
        return switch (ticketStatus) {
            case NEW -> OrderItemStatus.SENT_TO_KITCHEN;
            case ACCEPTED -> OrderItemStatus.ACCEPTED;
            case PREPARING -> OrderItemStatus.PREPARING;
            case READY -> OrderItemStatus.READY;
            case SERVED -> OrderItemStatus.SERVED;
            case CANCELLED -> OrderItemStatus.CANCELLED;
        };
    }
}
