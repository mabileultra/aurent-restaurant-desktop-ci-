package com.pos.restaurant.kitchen.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.kitchen.entity.KitchenStation;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import com.pos.restaurant.kitchen.entity.KitchenTicketLine;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketLineRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketRepository;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.settings.service.KitchenBoardService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SendToKitchenHandler {

    private final FloorOrderItemRepository itemRepository;
    private final KitchenTicketRepository ticketRepository;
    private final KitchenTicketLineRepository ticketLineRepository;
    private final KitchenStationRepository stationRepository;
    private final OrderLookup orderLookup;
    private final OrderResponseAssembler assembler;
    private final KitchenBoardService kitchenBoardService;

    @Transactional
    public OrderResponse handle(UUID orderId) {
        FloorOrder order = orderLookup.requireActive(orderId);
        if (!kitchenBoardService.isEnabled(order.getCompanyId(), order.getStoreId())) {
            throw new BusinessException("Kitchen board is turned off");
        }
        List<FloorOrderItem> newItems = itemRepository.findByOrderIdAndItemStatus(orderId, OrderItemStatus.NEW);
        if (newItems.isEmpty()) {
            throw new BusinessException("There are no new items to send to the kitchen");
        }
        Map<UUID, List<FloorOrderItem>> byStation = new LinkedHashMap<>();
        for (FloorOrderItem item : newItems) {
            byStation.computeIfAbsent(item.getStationId(), key -> new ArrayList<>()).add(item);
        }
        for (Map.Entry<UUID, List<FloorOrderItem>> entry : byStation.entrySet()) {
            KitchenStation station = resolveStation(entry.getKey(), order.getCompanyId());
            KitchenTicket ticket = ticketRepository.save(KitchenTicket.builder()
                .companyId(order.getCompanyId())
                .storeId(order.getStoreId())
                .order(order)
                .station(station)
                .status(KitchenTicketStatus.NEW)
                .build());
            for (FloorOrderItem item : entry.getValue()) {
                ticketLineRepository.save(KitchenTicketLine.builder()
                    .ticket(ticket)
                    .orderItem(item)
                    .build());
                item.setItemStatus(OrderItemStatus.SENT_TO_KITCHEN);
            }
        }
        LogUtil.info(SendToKitchenHandler.class, "Sent {} items to kitchen: orderId={}", newItems.size(), orderId);
        return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId));
    }

    private KitchenStation resolveStation(UUID stationId, Integer companyId) {
        if (stationId == null) {
            return null;
        }
        return stationRepository.findByIdAndCompanyId(stationId, companyId).orElse(null);
    }
}
