package com.pos.restaurant.kitchen.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.kitchen.dto.KitchenTicketResponse;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import com.pos.restaurant.kitchen.entity.KitchenTicketLine;
import com.pos.restaurant.kitchen.repository.KitchenTicketLineRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketRepository;
import com.pos.restaurant.kitchen.support.KitchenItemStatusMapper;
import com.pos.restaurant.kitchen.support.KitchenTicketAssembler;
import com.pos.restaurant.kitchen.support.KitchenTicketStatusPolicy;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UpdateKitchenTicketStatusHandler {

    private final KitchenTicketRepository ticketRepository;
    private final KitchenTicketLineRepository ticketLineRepository;
    private final FloorTenantSupport tenantSupport;
    private final KitchenTicketStatusPolicy statusPolicy;
    private final KitchenItemStatusMapper itemStatusMapper;
    private final KitchenTicketAssembler assembler;

    @Transactional
    public KitchenTicketResponse handle(UUID ticketId, KitchenTicketStatus nextStatus) {
        Integer companyId = tenantSupport.requireCompanyId();
        KitchenTicket ticket = ticketRepository.findByIdAndCompanyId(ticketId, companyId)
            .orElseThrow(() -> new NotFoundException("Kitchen ticket not found: " + ticketId));
        statusPolicy.assertTransition(ticket.getStatus(), nextStatus);
        ticket.setStatus(nextStatus);
        List<KitchenTicketLine> lines = ticketLineRepository.findByTicketId(ticketId);
        var itemStatus = itemStatusMapper.toItemStatus(nextStatus);
        for (KitchenTicketLine line : lines) {
            line.getOrderItem().setItemStatus(itemStatus);
        }
        LogUtil.info(UpdateKitchenTicketStatusHandler.class, "Kitchen ticket status {}: id={}", nextStatus, ticketId);
        return assembler.toResponse(ticket, lines);
    }
}
