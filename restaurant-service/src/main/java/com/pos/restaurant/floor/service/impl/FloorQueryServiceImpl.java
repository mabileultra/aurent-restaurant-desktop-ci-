package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.config.RestaurantCacheNames;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.booking.repository.FloorReservationRepository;
import com.pos.restaurant.booking.support.ReservationLookup;
import com.pos.restaurant.floor.dto.ActiveOrderSummary;
import com.pos.restaurant.floor.dto.FloorRevisionResponse;
import com.pos.restaurant.floor.dto.FloorSnapshotResponse;
import com.pos.restaurant.floor.dto.TableReservationSummary;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.entity.FloorTable;
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
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public FloorRevisionResponse getRevision(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        Long millis = orderRepository.findFloorRevisionMillis(companyId, storeId);
        return new FloorRevisionResponse(storeId, millis == null ? 0L : millis);
    }

    @Override
    @Cacheable(cacheNames = RestaurantCacheNames.FLOOR, key = "#storeId")
    public FloorSnapshotResponse getSnapshot(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        List<OrderStatus> activeStatuses = List.of(OrderStatus.OPEN, OrderStatus.BILLING);
        List<FloorOrderTableLink> links = linkRepository.findActiveByStore(companyId, storeId, activeStatuses);
        Map<Integer, List<FloorOrder>> openOrders = new HashMap<>();
        for (FloorOrder order : orderRepository.findTableOrdersByCompanyIdAndStoreIdAndStatusIn(
            companyId, storeId, activeStatuses
        )) {
            if (order.getTable() != null) {
                addOpenOrder(openOrders, order.getTable().getId(), order);
            }
        }
        for (FloorOrderTableLink link : links) {
            addOpenOrder(openOrders, link.getTable().getId(), link.getOrder());
        }

        List<UUID> orderIds = openOrders.values().stream()
            .flatMap(List::stream)
            .map(FloorOrder::getId)
            .distinct()
            .toList();
        Map<UUID, List<FloorOrderItem>> itemsByOrder = orderIds.isEmpty()
            ? Map.of()
            : itemRepository.findByOrderIdInOrdered(orderIds).stream()
                .collect(Collectors.groupingBy(item -> item.getOrder().getId()));

        Map<UUID, List<String>> linkedCodesByOrder = new HashMap<>();
        for (FloorOrderTableLink link : links) {
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
        Map<Integer, List<FloorTable>> tablesByHall = tableRepository
            .findByCompanyIdAndStoreIdAndActiveTrueOrderByHallSortAndCode(companyId, storeId)
            .stream()
            .collect(Collectors.groupingBy(table -> table.getHall().getId()));
        List<FloorSnapshotResponse.HallFloorResponse> hallResponses = halls.stream()
            .map(hall -> {
                List<TableResponse> tables = tablesByHall.getOrDefault(hall.getId(), List.of())
                    .stream()
                    .map(table -> {
                        TableResponse mapped = tableMapper.toResponse(table);
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
                        List<FloorOrder> ordersHere = openOrders.getOrDefault(table.getId(), List.of());
                        List<ActiveOrderSummary> summaries = ordersHere.stream()
                            .map(row -> toSummary(row, itemsByOrder, linkedCodesByOrder))
                            .toList();
                        ActiveOrderSummary first = summaries.isEmpty() ? null : summaries.get(0);
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
                            first,
                            reservationSummary,
                            mapped.servicePercent(),
                            summaries
                        );
                    })
                    .toList();
                return new FloorSnapshotResponse.HallFloorResponse(
                    hall.getId(),
                    hall.getName(),
                    hall.getSortOrder(),
                    hall.isActive(),
                    hall.getServicePercent(),
                    tables
                );
            })
            .toList();
        return new FloorSnapshotResponse(storeId, hallResponses);
    }

    private static void addOpenOrder(Map<Integer, List<FloorOrder>> openOrders, Integer tableId, FloorOrder order) {
        if (tableId == null || order == null) {
            return;
        }
        List<FloorOrder> list = openOrders.computeIfAbsent(tableId, ignored -> new ArrayList<>());
        if (list.stream().noneMatch(row -> row.getId().equals(order.getId()))) {
            list.add(order);
        }
        list.sort((a, b) -> Integer.compare(a.getOrderNo(), b.getOrderNo()));
    }

    private ActiveOrderSummary toSummary(
        FloorOrder order,
        Map<UUID, List<FloorOrderItem>> itemsByOrder,
        Map<UUID, List<String>> linkedCodesByOrder
    ) {
        List<FloorOrderItem> items = itemsByOrder.getOrDefault(order.getId(), List.of());
        return new ActiveOrderSummary(
            order.getId(),
            order.getOrderNo(),
            order.getStatus(),
            order.getGuestCount(),
            order.getAdultCount(),
            order.getChildrenCount(),
            orderTotals.billable(items),
            items.size(),
            order.getWaiterUserId(),
            order.getOpenedAt(),
            linkedCodesByOrder.getOrDefault(order.getId(), List.of())
        );
    }
}
