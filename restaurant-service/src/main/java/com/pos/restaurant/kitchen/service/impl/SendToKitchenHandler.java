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
import com.pos.restaurant.order.support.WeightSaleSupport;
import com.pos.restaurant.print.service.PrintJobPublisher;
import com.pos.restaurant.print.support.PrintJobPayloads;
import com.pos.restaurant.settings.service.KitchenBoardService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final PrintJobPublisher printJobPublisher;

    @Transactional
    public OrderResponse handle(UUID orderId) {
        FloorOrder order = orderLookup.requireActive(orderId);
        boolean kitchenBoard = kitchenBoardService.isEnabled(order.getCompanyId(), order.getStoreId());
        List<FloorOrderItem> allItems = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        List<PendingFire> pending = allItems.stream()
            .map(item -> new PendingFire(item, pendingQty(item)))
            .filter(row -> row.qty().signum() > 0)
            .toList();
        if (pending.isEmpty()) {
            throw new BusinessException("There are no new items to send to the kitchen");
        }
        List<PrintJobPayloads.KitchenSendLine> sendLines = pending.stream()
            .map(row -> new PrintJobPayloads.KitchenSendLine(
                row.item().getId(),
                row.qty(),
                WeightSaleSupport.kitchenNote(row.item().getMenuItem(), row.item().getNote(), row.qty())
            ))
            .toList();
        if (kitchenBoard) {
            Map<UUID, List<PendingFire>> byStation = new LinkedHashMap<>();
            for (PendingFire row : pending) {
                byStation.computeIfAbsent(row.item().getStationId(), key -> new ArrayList<>()).add(row);
            }
            for (Map.Entry<UUID, List<PendingFire>> entry : byStation.entrySet()) {
                KitchenStation station = resolveStation(entry.getKey(), order.getCompanyId());
                KitchenTicket ticket = ticketRepository.save(KitchenTicket.builder()
                    .companyId(order.getCompanyId())
                    .storeId(order.getStoreId())
                    .order(order)
                    .station(station)
                    .status(KitchenTicketStatus.NEW)
                    .build());
                for (PendingFire row : entry.getValue()) {
                    FloorOrderItem item = row.item();
                    ticketLineRepository.save(KitchenTicketLine.builder()
                        .ticket(ticket)
                        .orderItem(item)
                        .quantity(row.qty())
                        .build());
                    markSent(item);
                }
            }
        } else {
            for (PendingFire row : pending) {
                markSent(row.item());
            }
        }
        LogUtil.info(SendToKitchenHandler.class, "Sent {} lines to kitchen: orderId={}", pending.size(), orderId);
        if (kitchenBoard) {
            printJobPublisher.kitchenSend(order, sendLines);
        } else {
            Map<UUID, BigDecimal> qtyByItem = new LinkedHashMap<>();
            List<FloorOrderItem> fired = new ArrayList<>();
            for (PendingFire row : pending) {
                fired.add(row.item());
                qtyByItem.put(row.item().getId(), row.qty());
            }
            printJobPublisher.categorySlipsForPending(order, fired, qtyByItem);
        }
        return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId));
    }

    private static BigDecimal pendingQty(FloorOrderItem item) {
        if (item.getItemStatus() == OrderItemStatus.CANCELLED) {
            return BigDecimal.ZERO;
        }
        BigDecimal qty = item.getQuantity() == null ? BigDecimal.ZERO : item.getQuantity();
        BigDecimal sent = item.getSentQuantity() == null ? BigDecimal.ZERO : item.getSentQuantity();
        BigDecimal pending = qty.subtract(sent);
        return pending.signum() > 0 ? pending : BigDecimal.ZERO;
    }

    private static void markSent(FloorOrderItem item) {
        item.setSentQuantity(item.getQuantity() == null ? BigDecimal.ZERO : item.getQuantity());
        if (item.getItemStatus() == OrderItemStatus.NEW) {
            item.setItemStatus(OrderItemStatus.SENT_TO_KITCHEN);
        }
    }

    private KitchenStation resolveStation(UUID stationId, Integer companyId) {
        if (stationId == null) {
            return null;
        }
        return stationRepository.findByIdAndCompanyId(stationId, companyId).orElse(null);
    }

    private record PendingFire(FloorOrderItem item, BigDecimal qty) {}
}
