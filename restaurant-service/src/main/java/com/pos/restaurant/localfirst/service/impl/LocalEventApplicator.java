package com.pos.restaurant.localfirst.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.kitchen.service.impl.SendToKitchenHandler;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.payment.domain.PaymentCardType;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.restaurant.payment.service.impl.PayOrderHandler;
import com.pos.restaurant.payment.service.impl.RequestBillHandler;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.support.ShiftLookup;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Apply ingested local-first events to server domain (best-effort, no reprint).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LocalEventApplicator {

    private final FloorOrderRepository orderRepository;
    private final FloorOrderItemRepository itemRepository;
    private final FloorTableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final ShiftLookup shiftLookup;
    private final FloorTenantSupport tenantSupport;
    private final PayOrderHandler payOrderHandler;
    private final SendToKitchenHandler sendToKitchenHandler;
    private final RequestBillHandler requestBillHandler;
    private final ObjectMapper objectMapper;

    @Transactional
    public void apply(Integer companyId, Integer storeId, String eventType, String payloadJson) {
        if (eventType == null) return;
        try {
            JsonNode payload = objectMapper.readTree(payloadJson == null ? "{}" : payloadJson);
            switch (eventType) {
                case "ORDER_OPEN" -> applyOrderOpen(companyId, storeId, payload);
                case "ORDER_ADD_ITEM" -> applyOrderAddItem(companyId, storeId, payload);
                case "ORDER_UPDATE_ITEM" -> applyOrderUpdateItem(companyId, storeId, payload);
                case "ORDER_CANCEL_ITEM" -> applyOrderCancelItem(companyId, storeId, payload);
                case "ORDER_CANCEL" -> applyOrderCancel(companyId, storeId, payload);
                case "ORDER_PAY" -> applyOrderPay(companyId, storeId, payload);
                case "ORDER_SEND_KITCHEN" -> applySendKitchen(companyId, storeId, payload);
                case "ORDER_REQUEST_BILL" -> applyRequestBill(payload);
                case "ORDER_UPDATE_GUESTS" -> applyUpdateGuests(companyId, storeId, payload);
                case "ORDER_UPDATE_DISCOUNT" -> applyUpdateDiscount(companyId, storeId, payload);
                case "ORDER_ASSIGN_WAITER" -> applyAssignWaiter(companyId, storeId, payload);
                case "MENU_ITEM_UPSERT" -> applyMenuItemUpsert(companyId, storeId, payload);
                default -> log.debug("local-first apply ignored type={}", eventType);
            }
        } catch (Exception ex) {
            log.warn("local-first apply skipped type={}: {}", eventType, ex.toString());
        }
    }

    private void applyOrderOpen(Integer companyId, Integer storeId, JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        if (orderId == null) return;
        if (orderRepository.findById(orderId).isPresent()) {
            return;
        }

        Integer tableId = parseInt(text(payload, "tableId"));
        FloorTable table = null;
        if (tableId != null) {
            table = tableRepository.findByIdAndCompanyId(tableId, companyId).orElse(null);
            if (table != null && !storeId.equals(table.getStoreId())) {
                table = null;
            }
        }

        int guestCount = Math.max(1, intOr(payload, "guestCount", 1));
        int adultCount = Math.max(1, intOr(payload, "adultCount", guestCount));
        int childrenCount = Math.max(0, intOr(payload, "childrenCount", 0));
        if (adultCount + childrenCount != guestCount) {
            adultCount = Math.max(1, guestCount - childrenCount);
        }

        UUID waiterUserId = parseUuid(text(payload, "waiterId"));
        UUID openedBy = waiterUserId != null ? waiterUserId : tenantSupport.requireUserId();
        RestaurantShift shift = shiftLookup.findOpen(storeId).orElse(null);
        OrderChannel channel = parseChannel(text(payload, "channel"));

        FloorOrder order = FloorOrder.builder()
            .id(orderId)
            .companyId(companyId)
            .storeId(storeId)
            .table(table)
            .channel(channel)
            .shift(shift)
            .orderNo(orderRepository.findMaxOrderNo(storeId) + 1)
            .status(OrderStatus.OPEN)
            .guestCount(guestCount)
            .adultCount(adultCount)
            .childrenCount(childrenCount)
            .openedByUserId(openedBy)
            .waiterUserId(waiterUserId != null ? waiterUserId : openedBy)
            .comment(blankToNull(text(payload, "comment")))
            .build();
        orderRepository.save(order);

        if (table != null && table.getStatus() == TableStatus.FREE) {
            table.setStatus(TableStatus.OCCUPIED);
        }
        log.info("local-first ORDER_OPEN applied id={} storeId={}", orderId, storeId);
    }

    private void applyOrderAddItem(Integer companyId, Integer storeId, JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        UUID itemId = parseUuid(text(payload, "itemId"));
        if (orderId == null || itemId == null) return;

        if (itemRepository.findById(itemId).isPresent()) {
            return;
        }

        Optional<FloorOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            log.warn("local-first ORDER_ADD_ITEM skipped — order missing {}", orderId);
            return;
        }
        FloorOrder order = orderOpt.get();
        if (!companyId.equals(order.getCompanyId()) || !storeId.equals(order.getStoreId())) {
            return;
        }
        if (order.getStatus() == OrderStatus.CLOSED
            || order.getStatus() == OrderStatus.CANCELLED
            || order.getStatus() == OrderStatus.REFUNDED) {
            return;
        }
        if (order.getStatus() == OrderStatus.BILLING) {
            order.setStatus(OrderStatus.OPEN);
        }

        UUID menuItemId = parseUuid(text(payload, "menuItemId"));
        MenuItem menuItem = null;
        if (menuItemId != null) {
            menuItem = menuItemRepository.findByIdAndCompanyId(menuItemId, companyId).orElse(null);
            if (menuItem != null && !storeId.equals(menuItem.getStoreId())) {
                menuItem = null;
            }
        }

        BigDecimal quantity = decimalOr(payload, "quantity", BigDecimal.ONE)
            .setScale(3, RoundingMode.HALF_UP);
        if (quantity.compareTo(BigDecimal.ZERO) <= 0) return;

        BigDecimal unitPrice = decimalOr(payload, "unitPrice",
            menuItem != null && menuItem.getPrice() != null ? menuItem.getPrice() : BigDecimal.ZERO)
            .setScale(2, RoundingMode.HALF_UP);

        String name = text(payload, "name");
        if (name == null || name.isBlank()) {
            name = menuItem != null ? menuItem.getName() : "Item";
        }

        int nextSort = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId).size();
        FloorOrderItem line = FloorOrderItem.builder()
            .id(itemId)
            .order(order)
            .menuItem(menuItem)
            .name(name.trim())
            .quantity(quantity)
            .unitPrice(unitPrice)
            .taxRate(menuItem != null && menuItem.getTaxRate() != null
                ? menuItem.getTaxRate()
                : BigDecimal.ZERO)
            .stationId(menuItem != null ? menuItem.getStationId() : null)
            .note(blankToNull(text(payload, "note")))
            .itemStatus(OrderItemStatus.NEW)
            .sortOrder(nextSort)
            .build();
        itemRepository.save(line);
        // No PrintJobPublisher — kitchen slip already printed on the terminal.
        log.info("local-first ORDER_ADD_ITEM applied orderId={} itemId={}", orderId, itemId);
    }

    private void applyOrderUpdateItem(Integer companyId, Integer storeId, JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        UUID itemId = parseUuid(text(payload, "itemId"));
        if (orderId == null || itemId == null) return;
        Optional<FloorOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return;
        FloorOrder order = orderOpt.get();
        if (!companyId.equals(order.getCompanyId()) || !storeId.equals(order.getStoreId())) return;
        if (order.getStatus() == OrderStatus.CLOSED
            || order.getStatus() == OrderStatus.CANCELLED
            || order.getStatus() == OrderStatus.REFUNDED) {
            return;
        }
        FloorOrderItem item = itemRepository.findById(itemId).orElse(null);
        if (item == null || item.getOrder() == null || !orderId.equals(item.getOrder().getId())) return;
        if (item.getItemStatus() == OrderItemStatus.CANCELLED) return;

        BigDecimal quantity = decimalOr(payload, "quantity", item.getQuantity())
            .setScale(3, RoundingMode.HALF_UP);
        if (quantity.compareTo(BigDecimal.ZERO) <= 0) return;
        item.setQuantity(quantity);
        if (item.getSentQuantity() != null && item.getSentQuantity().compareTo(quantity) > 0) {
            item.setSentQuantity(quantity);
        }
        if (payload.has("note") && item.getItemStatus() == OrderItemStatus.NEW) {
            item.setNote(blankToNull(text(payload, "note")));
        }
        itemRepository.save(item);
        log.info("local-first ORDER_UPDATE_ITEM applied orderId={} itemId={}", orderId, itemId);
    }

    private void applyOrderCancelItem(Integer companyId, Integer storeId, JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        UUID itemId = parseUuid(text(payload, "itemId"));
        if (orderId == null || itemId == null) return;
        Optional<FloorOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return;
        FloorOrder order = orderOpt.get();
        if (!companyId.equals(order.getCompanyId()) || !storeId.equals(order.getStoreId())) return;

        FloorOrderItem item = itemRepository.findById(itemId).orElse(null);
        if (item == null || item.getOrder() == null || !orderId.equals(item.getOrder().getId())) return;
        if (item.getItemStatus() == OrderItemStatus.CANCELLED) return;

        boolean deleted = payload.path("deleted").asBoolean(false);
        if (deleted || item.getItemStatus() == OrderItemStatus.NEW) {
            itemRepository.delete(item);
        } else {
            item.setItemStatus(OrderItemStatus.CANCELLED);
            itemRepository.save(item);
        }
        log.info("local-first ORDER_CANCEL_ITEM applied orderId={} itemId={} deleted={}", orderId, itemId, deleted);
    }

    private void applyOrderCancel(Integer companyId, Integer storeId, JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        if (orderId == null) return;
        Optional<FloorOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return;
        FloorOrder order = orderOpt.get();
        if (!companyId.equals(order.getCompanyId()) || !storeId.equals(order.getStoreId())) return;
        if (order.getStatus() == OrderStatus.CANCELLED
            || order.getStatus() == OrderStatus.CLOSED
            || order.getStatus() == OrderStatus.REFUNDED) {
            return;
        }
        order.setStatus(OrderStatus.CANCELLED);
        order.setClosedAt(java.time.Instant.now());
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        for (FloorOrderItem item : items) {
            if (item.getItemStatus() != OrderItemStatus.CANCELLED) {
                item.setItemStatus(OrderItemStatus.CANCELLED);
                itemRepository.save(item);
            }
        }
        FloorTable table = order.getTable();
        if (table != null && table.getStatus() != TableStatus.FREE) {
            table.setStatus(TableStatus.FREE);
        }
        log.info("local-first ORDER_CANCEL applied id={}", orderId);
    }

    private void applyOrderPay(Integer companyId, Integer storeId, JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        if (orderId == null) return;
        Optional<FloorOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            log.warn("local-first ORDER_PAY skipped — order missing {}", orderId);
            return;
        }
        FloorOrder order = orderOpt.get();
        if (!companyId.equals(order.getCompanyId()) || !storeId.equals(order.getStoreId())) return;
        if (order.getStatus() == OrderStatus.CLOSED || order.getStatus() == OrderStatus.REFUNDED) {
            return;
        }
        if (order.getStatus() == OrderStatus.CANCELLED) return;

        if (order.getStatus() != OrderStatus.BILLING) {
            order.setStatus(OrderStatus.BILLING);
            orderRepository.save(order);
        }

        PaymentMethod method = parsePayMethod(text(payload, "method"));
        BigDecimal amount = decimalOr(payload, "amount", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) return;

        PayOrderRequest request = new PayOrderRequest(
            method,
            amount,
            decimalOr(payload, "cashAmount", BigDecimal.ZERO),
            decimalOr(payload, "cardAmount", BigDecimal.ZERO),
            decimalOr(payload, "amountTendered", amount),
            decimalOr(payload, "changeGiven", BigDecimal.ZERO),
            parseCardType(text(payload, "cardType")),
            blankToNull(text(payload, "debtPhone")),
            blankToNull(text(payload, "debtComment")),
            payload.hasNonNull("advancePaid")
                ? decimalOr(payload, "advancePaid", null)
                : null
        );
        payOrderHandler.handle(orderId, request);
        log.info("local-first ORDER_PAY applied id={} method={}", orderId, method);
    }

    private static PaymentMethod parsePayMethod(String raw) {
        if (raw == null || raw.isBlank()) return PaymentMethod.CASH;
        try {
            return PaymentMethod.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return PaymentMethod.CASH;
        }
    }

    private static PaymentCardType parseCardType(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return PaymentCardType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private void applyRequestBill(JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        if (orderId == null) return;
        try {
            requestBillHandler.handle(orderId);
        } catch (BusinessException ex) {
            log.debug("local-first ORDER_REQUEST_BILL skipped orderId={}: {}", orderId, ex.toString());
        }
    }

    private void applyUpdateGuests(Integer companyId, Integer storeId, JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        if (orderId == null) return;
        Optional<FloorOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return;
        FloorOrder order = orderOpt.get();
        if (!companyId.equals(order.getCompanyId()) || !storeId.equals(order.getStoreId())) return;
        int guestCount = Math.max(1, intOr(payload, "guestCount", order.getGuestCount() > 0 ? order.getGuestCount() : 1));
        int childrenCount = Math.max(0, intOr(payload, "childrenCount", 0));
        int adultCount = Math.max(1, intOr(payload, "adultCount", guestCount - childrenCount));
        order.setGuestCount(guestCount);
        order.setAdultCount(adultCount);
        order.setChildrenCount(childrenCount);
        orderRepository.save(order);
        log.info("local-first ORDER_UPDATE_GUESTS applied orderId={}", orderId);
    }

    private void applyUpdateDiscount(Integer companyId, Integer storeId, JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        if (orderId == null) return;
        Optional<FloorOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return;
        FloorOrder order = orderOpt.get();
        if (!companyId.equals(order.getCompanyId()) || !storeId.equals(order.getStoreId())) return;
        BigDecimal discount = decimalOr(payload, "discountAmount", BigDecimal.ZERO)
            .setScale(2, RoundingMode.HALF_UP);
        if (discount.compareTo(BigDecimal.ZERO) < 0) discount = BigDecimal.ZERO;
        order.setDiscountAmount(discount);
        orderRepository.save(order);
        log.info("local-first ORDER_UPDATE_DISCOUNT applied orderId={}", orderId);
    }

    private void applyAssignWaiter(Integer companyId, Integer storeId, JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        if (orderId == null) return;
        Optional<FloorOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return;
        FloorOrder order = orderOpt.get();
        if (!companyId.equals(order.getCompanyId()) || !storeId.equals(order.getStoreId())) return;
        UUID waiterId = parseUuid(text(payload, "waiterId"));
        order.setWaiterUserId(waiterId);
        orderRepository.save(order);
        log.info("local-first ORDER_ASSIGN_WAITER applied orderId={}", orderId);
    }

    private void applyMenuItemUpsert(Integer companyId, Integer storeId, JsonNode payload) {
        String name = blankToNull(text(payload, "name"));
        if (name == null) return;
        BigDecimal price = decimalOr(payload, "price", BigDecimal.ZERO)
            .setScale(2, RoundingMode.HALF_UP);
        if (price.compareTo(BigDecimal.ZERO) < 0) {
            price = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        UUID id = parseUuid(text(payload, "id"));
        UUID categoryId = parseUuid(text(payload, "categoryId"));

        if (id != null) {
            Optional<MenuItem> existing = menuItemRepository.findByIdAndCompanyId(id, companyId);
            if (existing.isPresent()) {
                MenuItem item = existing.get();
                if (!storeId.equals(item.getStoreId())) return;
                item.setName(name);
                item.setPrice(price);
                if (categoryId != null) {
                    item.setMenuCategoryId(categoryId);
                }
                menuItemRepository.save(item);
                log.info("local-first MENU_ITEM_UPSERT updated id={}", id);
                return;
            }
        }

        UUID newId = id != null ? id : UUID.randomUUID();
        MenuItem created = MenuItem.builder()
            .id(newId)
            .companyId(companyId)
            .storeId(storeId)
            .itemType(MenuItemType.DISH)
            .name(name)
            .price(price)
            .taxRate(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
            .menuCategoryId(categoryId)
            .active(true)
            .available(true)
            .sortOrder(100)
            .build();
        menuItemRepository.save(created);
        log.info("local-first MENU_ITEM_UPSERT created id={}", newId);
    }

    private void applySendKitchen(Integer companyId, Integer storeId, JsonNode payload) {
        UUID orderId = parseUuid(text(payload, "orderId"));
        if (orderId == null) return;
        Optional<FloorOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return;
        FloorOrder order = orderOpt.get();
        if (!companyId.equals(order.getCompanyId()) || !storeId.equals(order.getStoreId())) {
            return;
        }
        // Waiter PWA: no local printer — fire classic send (print jobs + mark sent).
        if (payload != null && payload.path("printOnServer").asBoolean(false)) {
            try {
                sendToKitchenHandler.handle(orderId);
            } catch (BusinessException ex) {
                log.debug("local-first printOnServer skipped orderId={}: {}", orderId, ex.toString());
            }
            return;
        }
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        JsonNode itemIds = payload.get("itemIds");
        if (itemIds != null && itemIds.isArray() && itemIds.size() > 0) {
            for (Iterator<JsonNode> it = itemIds.elements(); it.hasNext(); ) {
                UUID id = parseUuid(it.next().asText(null));
                if (id == null) continue;
                items.stream()
                    .filter(i -> id.equals(i.getId()))
                    .findFirst()
                    .ifPresent(this::markSent);
            }
            return;
        }
        for (FloorOrderItem item : items) {
            if (item.getItemStatus() == OrderItemStatus.CANCELLED) continue;
            BigDecimal qty = item.getQuantity() == null ? BigDecimal.ZERO : item.getQuantity();
            BigDecimal sent = item.getSentQuantity() == null ? BigDecimal.ZERO : item.getSentQuantity();
            if (qty.compareTo(sent) > 0) {
                markSent(item);
            }
        }
    }

    private void markSent(FloorOrderItem item) {
        item.setSentQuantity(item.getQuantity() == null ? BigDecimal.ZERO : item.getQuantity());
        if (item.getItemStatus() == OrderItemStatus.NEW) {
            item.setItemStatus(OrderItemStatus.SENT_TO_KITCHEN);
        }
        itemRepository.save(item);
    }

    private static OrderChannel parseChannel(String raw) {
        if (raw == null || raw.isBlank()) return OrderChannel.DINE_IN;
        try {
            return OrderChannel.valueOf(raw.trim());
        } catch (IllegalArgumentException ex) {
            return OrderChannel.DINE_IN;
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node == null ? null : node.get(field);
        return v == null || v.isNull() ? null : v.asText(null);
    }

    private static int intOr(JsonNode node, String field, int fallback) {
        JsonNode v = node == null ? null : node.get(field);
        if (v == null || v.isNull()) return fallback;
        if (v.isNumber()) return v.asInt(fallback);
        try {
            return Integer.parseInt(v.asText().trim());
        } catch (Exception ex) {
            return fallback;
        }
    }

    private static Integer parseInt(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Integer.valueOf(raw.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static BigDecimal decimalOr(JsonNode node, String field, BigDecimal fallback) {
        JsonNode v = node == null ? null : node.get(field);
        if (v == null || v.isNull()) return fallback;
        if (v.isNumber()) return v.decimalValue();
        try {
            return new BigDecimal(v.asText().trim());
        } catch (Exception ex) {
            return fallback;
        }
    }

    private static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
