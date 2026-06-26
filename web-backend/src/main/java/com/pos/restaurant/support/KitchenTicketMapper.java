package com.pos.restaurant.support;

import com.pos.restaurant.dto.KitchenTicketResponse;
import com.pos.restaurant.entity.KitchenTicket;
import org.springframework.stereotype.Component;

@Component
public class KitchenTicketMapper {

    public KitchenTicketResponse toResponse(KitchenTicket ticket) {
        return new KitchenTicketResponse(
            ticket.getId(),
            ticket.getStore().getId(),
            ticket.getSession().getId(),
            ticket.getSessionLine().getId(),
            ticket.getTableCode(),
            ticket.getProduct().getId(),
            ticket.getProductName(),
            ticket.getQuantity(),
            ticket.getNote(),
            ticket.getKitchenDepartment(),
            ticket.getStatus(),
            ticket.getCreatedAt(),
            ticket.getUpdatedAt()
        );
    }
}
