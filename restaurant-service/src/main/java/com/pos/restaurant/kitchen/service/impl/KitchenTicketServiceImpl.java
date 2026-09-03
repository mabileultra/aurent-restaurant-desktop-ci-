package com.pos.restaurant.kitchen.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.kitchen.dto.KitchenTicketResponse;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import com.pos.restaurant.kitchen.entity.KitchenTicketLine;
import com.pos.restaurant.kitchen.repository.KitchenTicketLineRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketRepository;
import com.pos.restaurant.kitchen.service.KitchenTicketService;
import com.pos.restaurant.kitchen.support.KitchenTicketAssembler;
import com.pos.restaurant.order.dto.OrderResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KitchenTicketServiceImpl implements KitchenTicketService {

    private static final Duration BOARD_WINDOW = Duration.ofHours(18);

    private final KitchenTicketRepository ticketRepository;
    private final KitchenTicketLineRepository ticketLineRepository;
    private final FloorTenantSupport tenantSupport;
    private final KitchenTicketAssembler assembler;
    private final SendToKitchenHandler sendHandler;
    private final UpdateKitchenTicketStatusHandler updateStatusHandler;

    @Override
    public OrderResponse send(UUID orderId) {
        return sendHandler.handle(orderId);
    }

    @Override
    public List<KitchenTicketResponse> listBoard(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        List<KitchenTicket> tickets = ticketRepository.findActiveBoard(
            companyId,
            storeId,
            KitchenTicketStatus.CANCELLED,
            Instant.now().minus(BOARD_WINDOW)
        );
        if (tickets.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = tickets.stream().map(KitchenTicket::getId).toList();
        Map<UUID, List<KitchenTicketLine>> linesByTicket = ticketLineRepository.findByTicketIdIn(ids).stream()
            .collect(Collectors.groupingBy(line -> line.getTicket().getId()));
        return tickets.stream()
            .map(ticket -> assembler.toResponse(ticket, linesByTicket.getOrDefault(ticket.getId(), List.of())))
            .toList();
    }

    @Override
    public KitchenTicketResponse updateStatus(UUID ticketId, KitchenTicketStatus status) {
        return updateStatusHandler.handle(ticketId, status);
    }
}
