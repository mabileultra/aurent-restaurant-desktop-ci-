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
        join fetch l.orderItem oi
        left join fetch oi.menuItem
        where l.ticket.id = :ticketId
        order by oi.sortOrder
        """)
    List<KitchenTicketLine> findByTicketId(@Param("ticketId") UUID ticketId);

    @Query("""
        select l from KitchenTicketLine l
        join fetch l.orderItem oi
        left join fetch oi.menuItem
        where l.ticket.id in :ticketIds
        order by oi.sortOrder
        """)
    List<KitchenTicketLine> findByTicketIdIn(@Param("ticketIds") List<UUID> ticketIds);
}
