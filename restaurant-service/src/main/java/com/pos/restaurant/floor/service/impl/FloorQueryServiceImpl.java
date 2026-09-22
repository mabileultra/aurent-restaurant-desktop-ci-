package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.booking.repository.FloorReservationRepository;
import com.pos.restaurant.booking.support.ReservationLookup;
import com.pos.restaurant.floor.dto.ActiveOrderSummary;
import com.pos.restaurant.floor.dto.FloorSnapshotResponse;
import com.pos.restaurant.floor.dto.TableReservationSummary;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.mapper.FloorTableMapper;
import com.pos.restaurant.floor.repository.FloorHallRepository;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.service.FloorQueryService;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.entity.FloorOrderTableLink;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.repository.FloorOrderTableLinkRepository;
import com.pos.restaurant.order.support.OrderTotals;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FloorQueryServiceImpl implements FloorQueryService {

    private final FloorHallRepository hallRepository;
    private final FloorTableRepository tableRepository;
    private final FloorTableMapper tableMapper;
    private final FloorTenantSupport tenantSupport;
    private final FloorOrderRepository orderRepository;
    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderTableLinkRepository linkRepository;
    private final FloorReservationRepository reservationRepository;
    private final OrderTotals orderTotals;

    @Override
    public FloorSnapshotResponse getSnapshot(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        List<OrderStatus> activeStatuses = List.of(OrderStatus.OPEN, OrderStatus.BILLING);
        Map<Integer, FloorOrder> openOrders = new HashMap<>();
        for (FloorOrder order : orderRepository.findTableOrdersByCompanyIdAndStoreIdAndStatusIn(
            companyId, storeId, activeStatuses
        )) {
            if (order.getTable() != null) {
                openOrders.putIfAbsent(order.getTable().getId(), order);
            }
        }
        for (FloorOrderTableLink link : linkRepository.findActiveByStore(companyId, storeId, activeStatuses)) {
            openOrders.putIfAbsent(link.getTable().getId(), link.getOrder());
        }

        Map<UUID, List<FloorOrderItem>> itemsByOrder = openOrders.values().stream()
            .collect(Collectors.toMap(
                FloorOrder::getId,
                order -> itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(order.getId()),
                (a, b) -> a
            ));

        Map<UUID, List<String>> linkedCodesByOrder = new HashMap<>();
        for (FloorOrderTableLink link : linkRepository.findActiveByStore(companyId, storeId, activeStatuses)) {
            linkedCodesByOrder
                .computeIfAbsent(link.getOrder().getId(), ignored -> new ArrayList<>())
                .add(link.getTable().getCode());
        }

        Map<Integer, FloorReservation> reservations = new HashMap<>();
        for (FloorReservation reservation : reservationRepository.findByStoreAndStatuses(
            companyId,
            storeId,
            ReservationLookup.ACTIVE_STATUSES
        )) {
            reservations.putIfAbsent(reservation.getTable().getId(), reservation);
        }
        List<FloorHall> halls = hallRepository.findByCompanyIdAndStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(
            companyId,
            storeId
        );
        List<FloorSnapshotResponse.HallFloorResponse> hallResponses = halls.stream()
            .map(hall -> {
                List<TableResponse> tables = tableRepository.findByHallIdAndActiveTrueOrderByCodeAsc(hall.getId())
                    .stream()
                    .map(table -> {
                        TableResponse mapped = tableMapper.toResponse(table);
                        FloorOrder order = openOrders.get(table.getId());
                        FloorReservation reservation = reservations.get(table.getId());
                        TableReservationSummary reservationSummary = reservation == null
                            ? null
                            : new TableReservationSummary(
                                reservation.getId(),
                                reservation.getClientName(),
                                reservation.getClientPhone(),
                                reservation.getGuestCount(),
                                reservation.getReservedAt(),
                                reservation.getNotes()
                            );
                        if (order == null) {
                            return new TableResponse(
                                mapped.id(),
                                mapped.hallId(),
                                mapped.hallName(),
                                mapped.code(),
                                mapped.label(),
                                mapped.seatCount(),
                                mapped.posX(),
                                mapped.posY(),
                                mapped.width(),
                                mapped.height(),
                                mapped.status(),
                                mapped.active(),
                                mapped.updatedAt(),
                                null,
                                reservationSummary
                            );
                        }
                        List<FloorOrderItem> items = itemsByOrder.getOrDefault(order.getId(), List.of());
                        BigDecimal subtotal = orderTotals.billable(items);
                        List<String> linkedCodes = linkedCodesByOrder.getOrDefault(order.getId(), List.of());
                        return new TableResponse(
                            mapped.id(),
                            mapped.hallId(),
                            mapped.hallName(),
                            mapped.code(),
                            mapped.label(),
                            mapped.seatCount(),
                            mapped.posX(),
                            mapped.posY(),
                            mapped.width(),
                            mapped.height(),
                            mapped.status(),
                            mapped.active(),
                            mapped.updatedAt(),
                            new ActiveOrderSummary(
                                order.getId(),
                                order.getOrderNo(),
                                order.getStatus(),
                                order.getGuestCount(),
                                order.getAdultCount(),
                                order.getChildrenCount(),
                                subtotal,
                                items.size(),
                                order.getWaiterUserId(),
                                order.getOpenedAt(),
                                linkedCodes
                            ),
                            reservationSummary
                        );
                    })
                    .toList();
                return new FloorSnapshotResponse.HallFloorResponse(
                    hall.getId(),
                    hall.getName(),
                    hall.getSortOrder(),
                    hall.isActive(),
                    tables
                );
            })
            .toList();
        return new FloorSnapshotResponse(storeId, hallResponses);
    }
}
