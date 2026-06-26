package com.pos.restaurant.service.impl;

import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.restaurant.domain.KitchenTicketStatus;
import com.pos.restaurant.domain.TableSessionStatus;
import com.pos.restaurant.dto.KitchenTicketResponse;
import com.pos.restaurant.dto.TableSessionResponse;
import com.pos.restaurant.dto.UpdateKitchenTicketStatusRequest;
import com.pos.restaurant.entity.KitchenTicket;
import com.pos.restaurant.entity.TableSession;
import com.pos.restaurant.entity.TableSessionLine;
import com.pos.restaurant.repository.KitchenTicketRepository;
import com.pos.restaurant.repository.TableSessionLineRepository;
import com.pos.restaurant.repository.TableSessionRepository;
import com.pos.restaurant.service.KitchenTicketService;
import com.pos.restaurant.support.KitchenDepartmentResolver;
import com.pos.restaurant.support.KitchenTicketMapper;
import com.pos.restaurant.support.RestaurantStoreSupport;
import com.pos.restaurant.support.TableSessionMapper;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class KitchenTicketServiceImpl implements KitchenTicketService {

    private static final EnumSet<KitchenTicketStatus> ACTIVE_STATUSES = EnumSet.of(
        KitchenTicketStatus.PENDING,
        KitchenTicketStatus.IN_PROGRESS,
        KitchenTicketStatus.READY
    );

    private final KitchenTicketRepository ticketRepository;
    private final TableSessionRepository sessionRepository;
    private final TableSessionLineRepository lineRepository;
    private final RestaurantStoreSupport storeSupport;
    private final KitchenDepartmentResolver departmentResolver;
    private final KitchenTicketMapper ticketMapper;
    private final TableSessionMapper sessionMapper;

    @Override
    public TableSessionResponse sendToKitchen(UUID sessionId, String kitchenDepartment) {
        TableSession session = requireOpenSession(sessionId);
        List<TableSessionLine> lines = lineRepository.findBySessionIdOrderBySortOrderAscCreatedAtAsc(sessionId);
        String departmentFilter = normalizeDepartmentFilter(kitchenDepartment);
        int sent = 0;
        for (TableSessionLine line : lines) {
            if (line.getKitchenStatus() != null || ticketRepository.existsBySessionLineId(line.getId())) {
                continue;
            }
            String department = departmentResolver.resolve(line.getProduct().getId());
            if (!departmentResolver.isKitchenRoutable(department)) {
                continue;
            }
            if (departmentFilter != null && !departmentFilter.equalsIgnoreCase(department)) {
                continue;
            }
            KitchenTicket ticket = KitchenTicket.builder()
                .store(session.getStore())
                .session(session)
                .sessionLine(line)
                .tableCode(session.getTable().getCode())
                .product(line.getProduct())
                .productName(line.getProduct().getName())
                .quantity(line.getQuantity())
                .note(line.getNote())
                .kitchenDepartment(department)
                .status(KitchenTicketStatus.PENDING)
                .build();
            ticketRepository.save(ticket);
            line.setKitchenStatus(KitchenTicketStatus.PENDING.name());
            lineRepository.save(line);
            sent++;
        }
        if (sent == 0) {
            throw new BadRequestException("No new items to send to kitchen");
        }
        LogUtil.info(
            KitchenTicketServiceImpl.class,
            "Kitchen tickets sent: sessionId={}, department={}, count={}",
            sessionId,
            departmentFilter != null ? departmentFilter : "ALL",
            sent
        );
        return sessionMapper.toResponse(session, lines);
    }

    private String normalizeDepartmentFilter(String kitchenDepartment) {
        if (!StringUtils.hasText(kitchenDepartment) || "ALL".equalsIgnoreCase(kitchenDepartment.trim())) {
            return null;
        }
        return kitchenDepartment.trim().toUpperCase(Locale.ROOT);
    }

    @Override
    @Transactional(readOnly = true)
    public List<KitchenTicketResponse> listActiveTickets(Integer storeId, String kitchenDepartment) {
        storeSupport.requireRestaurantStore(storeId);
        List<KitchenTicket> tickets;
        if (StringUtils.hasText(kitchenDepartment) && !"ALL".equalsIgnoreCase(kitchenDepartment)) {
            tickets = ticketRepository.findByStoreIdAndKitchenDepartmentIgnoreCaseAndStatusInOrderByCreatedAtAsc(
                storeId, kitchenDepartment.trim(), ACTIVE_STATUSES);
        } else {
            tickets = ticketRepository.findByStoreIdAndStatusInOrderByCreatedAtAsc(storeId, ACTIVE_STATUSES);
        }
        return tickets.stream().map(ticketMapper::toResponse).toList();
    }

    @Override
    public KitchenTicketResponse updateStatus(UUID ticketId, UpdateKitchenTicketStatusRequest request) {
        KitchenTicket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Kitchen ticket not found"));
        storeSupport.requireRestaurantStore(ticket.getStore().getId());
        KitchenTicketStatus status = request.status();
        if (status == KitchenTicketStatus.CANCELLED) {
            throw new BadRequestException("Use session cancel instead of ticket cancel");
        }
        ticket.setStatus(status);
        ticketRepository.save(ticket);
        TableSessionLine line = ticket.getSessionLine();
        line.setKitchenStatus(status.name());
        lineRepository.save(line);
        LogUtil.info(KitchenTicketServiceImpl.class, "Kitchen ticket status updated: id={}, status={}", ticketId, status);
        return ticketMapper.toResponse(ticket);
    }

    private TableSession requireOpenSession(UUID sessionId) {
        TableSession session = sessionRepository.findWithDetailsById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Table session not found"));
        storeSupport.requireRestaurantStore(session.getStore().getId());
        if (session.getStatus() != TableSessionStatus.OPEN) {
            throw new BadRequestException("Session is not open");
        }
        return session;
    }
}
