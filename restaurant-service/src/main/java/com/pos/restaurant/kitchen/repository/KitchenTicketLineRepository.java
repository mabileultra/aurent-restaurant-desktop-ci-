package com.pos.restaurant.kitchen.repository;

import com.pos.restaurant.kitchen.entity.KitchenTicketLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface KitchenTicketLineRepository extends JpaRepository<KitchenTicketLine, UUID> {

    @Query("""
        select l from KitchenTicketLine l
        join fetch l.orderItem
        where l.ticket.id = :ticketId
        order by l.orderItem.sortOrder
        """)
    List<KitchenTicketLine> findByTicketId(@Param("ticketId") UUID ticketId);

    @Query("""
        select l from KitchenTicketLine l
        join fetch l.orderItem
        where l.ticket.id in :ticketIds
        order by l.orderItem.sortOrder
        """)
    List<KitchenTicketLine> findByTicketIdIn(@Param("ticketIds") List<UUID> ticketIds);
}
