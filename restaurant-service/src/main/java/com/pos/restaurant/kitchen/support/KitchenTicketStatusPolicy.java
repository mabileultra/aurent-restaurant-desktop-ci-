package com.pos.restaurant.kitchen.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Component
public class KitchenTicketStatusPolicy {

    private static final Map<KitchenTicketStatus, Set<KitchenTicketStatus>> ALLOWED = Map.of(
        KitchenTicketStatus.NEW, Set.of(KitchenTicketStatus.ACCEPTED, KitchenTicketStatus.CANCELLED),
        KitchenTicketStatus.ACCEPTED, Set.of(KitchenTicketStatus.PREPARING, KitchenTicketStatus.READY, KitchenTicketStatus.CANCELLED),
        KitchenTicketStatus.PREPARING, Set.of(KitchenTicketStatus.READY, KitchenTicketStatus.CANCELLED),
        KitchenTicketStatus.READY, Set.of(KitchenTicketStatus.SERVED),
        KitchenTicketStatus.SERVED, Set.of(),
        KitchenTicketStatus.CANCELLED, Set.of()
    );

    public void assertTransition(KitchenTicketStatus from, KitchenTicketStatus to) {
        if (from == to) {
            return;
        }
        Set<KitchenTicketStatus> next = ALLOWED.getOrDefault(from, Set.of());
        if (!next.contains(to)) {
            throw new BusinessException("Cannot change kitchen ticket from " + from + " to " + to);
        }
    }
}
