package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.floor.dto.ActiveOrderSummary;
import com.pos.restaurant.floor.dto.FloorSnapshotResponse;
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
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.support.OrderTotals;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final OrderTotals orderTotals;

    @Override
    public FloorSnapshotResponse getSnapshot(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        Map<Integer, FloorOrder> openOrders = orderRepository
            .findByCompanyIdAndStoreIdAndStatusIn(companyId, storeId, List.of(OrderStatus.OPEN, OrderStatus.BILLING))
            .stream()
            .collect(Collectors.toMap(order -> order.getTable().getId(), order -> order, (a, b) -> a));
        Map<UUID, List<FloorOrderItem>> itemsByOrder = openOrders.values().stream()
            .collect(Collectors.toMap(
                FloorOrder::getId,
                order -> itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(order.getId())
            ));
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
                        if (order == null) {
                            return mapped;
                        }
                        List<FloorOrderItem> items = itemsByOrder.getOrDefault(order.getId(), List.of());
                        BigDecimal subtotal = orderTotals.billable(items);
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
                            new ActiveOrderSummary(
                                order.getId(),
                                order.getOrderNo(),
                                order.getGuestCount(),
                                order.getAdultCount(),
                                order.getChildrenCount(),
                                subtotal,
                                items.size()
                            )
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
