package com.pos.restaurant.print.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.menu.entity.MenuCategory;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuCategoryRepository;
import com.pos.restaurant.menu.support.MenuPortionFormat;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.entity.FloorOrderItemModifier;
import com.pos.restaurant.order.repository.FloorOrderItemModifierRepository;
import com.pos.restaurant.order.support.WeightSaleSupport;
import com.pos.restaurant.print.domain.PrintJobKind;
import com.pos.restaurant.print.entity.RestaurantPrintJob;
import com.pos.restaurant.print.repository.RestaurantPrintJobRepository;
import com.pos.restaurant.print.support.PrintJobPayloads;
import com.pos.restaurant.settings.service.KitchenBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PrintJobPublisher {

    private final RestaurantPrintJobRepository repository;
    private final MenuCategoryRepository menuCategoryRepository;
    private final FloorOrderItemModifierRepository itemModifierRepository;
    private final KitchenBoardService kitchenBoardService;
    private final ObjectMapper objectMapper;

    public void pickupLabel(FloorOrder order, List<FloorOrderItem> items) {
        if (order == null || order.getPickupNo() == null || order.getPickupNo() <= 0) {
            return;
        }
        String channel = order.getChannel() == null ? OrderChannel.DINE_IN.name() : order.getChannel().name();
        String printedAt = java.time.Instant.now().toString();
        List<FloorOrderItem> rows = items == null ? List.of() : items;
        if (rows.isEmpty()) {
            enqueue(order, PrintJobKind.PICKUP_LABEL, new PrintJobPayloads.PickupLabel(
                order.getId(), order.getPickupNo(), channel, printedAt, List.of()
            ));
            return;
        }
        for (FloorOrderItem item : rows) {
            enqueue(order, PrintJobKind.PICKUP_LABEL, new PrintJobPayloads.PickupLabel(
                order.getId(),
                order.getPickupNo(),
                channel,
                printedAt,
                List.of(new PrintJobPayloads.PickupLine(
                    item.getName(),
                    item.getQuantity() == null ? BigDecimal.ONE : item.getQuantity()
                ))
            ));
        }
    }

    public void guestBill(FloorOrder order) {
        enqueue(order, PrintJobKind.GUEST_BILL, new PrintJobPayloads.GuestBill(
            order.getId(),
            ticketHeader(order)
        ));
    }

    public void kitchenSend(FloorOrder order, List<PrintJobPayloads.KitchenSendLine> lines) {
        if (lines == null || lines.isEmpty()) {
            return;
        }
        List<UUID> itemIds = lines.stream().map(PrintJobPayloads.KitchenSendLine::itemId).toList();
        enqueue(order, PrintJobKind.KITCHEN_SEND, new PrintJobPayloads.KitchenSend(order.getId(), itemIds, lines));
    }

    /**
     * When KDS board is off: one batch job per Windows printer for all sent auto-print lines.
     */
    public void categorySlipsForItems(FloorOrder order, List<FloorOrderItem> items) {
        enqueueCategoryBatches(order, items, null, false);
    }

    /** Board off + reorder: print only the pending delta qty per line. */
    public void categorySlipsForPending(FloorOrder order, List<FloorOrderItem> items, Map<UUID, BigDecimal> qtyByItemId) {
        enqueueCategoryBatches(order, items, qtyByItemId, false);
    }

    /**
     * Cancel / refuse: same printers that got the dish on send.
     * Board off → category auto-print printers. Board on → station (kitchen) printers.
     */
    public void voidSlipsForItems(FloorOrder order, List<FloorOrderItem> items) {
        voidSlipsForItems(order, items, null);
    }

    /** Qty cut refuse: void only the refused delta. */
    public void voidSlipsForItems(FloorOrder order, List<FloorOrderItem> items, Map<UUID, BigDecimal> qtyByItemId) {
        if (order == null || items == null || items.isEmpty()) {
            return;
        }
        if (kitchenBoardService.isEnabled(order.getCompanyId(), order.getStoreId())) {
            enqueueKitchenVoid(order, items, qtyByItemId);
        } else {
            enqueueCategoryBatches(order, items, qtyByItemId, true);
        }
    }

    private void enqueueKitchenVoid(
        FloorOrder order,
        List<FloorOrderItem> items,
        Map<UUID, BigDecimal> qtyOverride
    ) {
        List<PrintJobPayloads.KitchenSendLine> lines = new ArrayList<>();
        for (FloorOrderItem item : items) {
            if (item.getItemStatus() == com.pos.restaurant.order.domain.OrderItemStatus.CANCELLED) {
                continue;
            }
            if (item.getItemStatus() == com.pos.restaurant.order.domain.OrderItemStatus.NEW) {
                continue;
            }
            BigDecimal qty = qtyOverride != null && qtyOverride.containsKey(item.getId())
                ? qtyOverride.get(item.getId())
                : (item.getQuantity() == null ? BigDecimal.ONE : item.getQuantity());
            if (qty == null || qty.signum() <= 0) {
                continue;
            }
            lines.add(new PrintJobPayloads.KitchenSendLine(
                item.getId(),
                qty,
                WeightSaleSupport.kitchenNote(item.getMenuItem(), item.getNote(), qty)
            ));
        }
        if (lines.isEmpty()) {
            return;
        }
        List<UUID> itemIds = lines.stream().map(PrintJobPayloads.KitchenSendLine::itemId).toList();
        enqueue(order, PrintJobKind.KITCHEN_SEND, new PrintJobPayloads.KitchenSend(
            order.getId(),
            itemIds,
            lines,
            true
        ));
    }

    /**
     * Full order cancel from cashier — one slip on the cashier receipt printer
     * (not kitchen / category stations).
     */
    public void orderCancelSlip(FloorOrder order, List<FloorOrderItem> items) {
        if (order == null || items == null || items.isEmpty()) {
            return;
        }
        Map<UUID, List<FloorOrderItemModifier>> modifiers = loadModifiers(items);
        List<PrintJobPayloads.CategoryBatchLine> lines = new ArrayList<>();
        for (FloorOrderItem item : items) {
            if (item.getItemStatus() == com.pos.restaurant.order.domain.OrderItemStatus.CANCELLED) {
                continue;
            }
            BigDecimal qty = item.getQuantity() == null ? BigDecimal.ONE : item.getQuantity();
            if (qty.signum() <= 0) {
                continue;
            }
            MenuItem menuItem = item.getMenuItem();
            lines.add(new PrintJobPayloads.CategoryBatchLine(
                item.getName(),
                qty,
                MenuPortionFormat.display(menuItem),
                WeightSaleSupport.kitchenNote(menuItem, item.getNote(), qty),
                modifierNames(modifiers.getOrDefault(item.getId(), List.of())),
                item.getUnitPrice() == null ? BigDecimal.ZERO : item.getUnitPrice()
            ));
        }
        if (lines.isEmpty()) {
            return;
        }
        enqueue(order, PrintJobKind.ORDER_CANCEL, new PrintJobPayloads.OrderCancel(
            order.getId(),
            kitchenPlaceLine(order),
            order.getWaiterUserId(),
            lines
        ));
    }

    private void enqueueCategoryBatches(
        FloorOrder order,
        List<FloorOrderItem> items,
        Map<UUID, BigDecimal> qtyOverride,
        boolean voidSlip
    ) {
        if (order == null || items == null || items.isEmpty()) {
            return;
        }
        Map<UUID, MenuCategory> categories = new HashMap<>();
        Map<String, List<PrintJobPayloads.CategoryBatchLine>> byPrinter = new LinkedHashMap<>();
        Map<String, String> titleByPrinter = new HashMap<>();
        Map<UUID, List<FloorOrderItemModifier>> modifiers = loadModifiers(items);

        for (FloorOrderItem item : items) {
            if (item.getItemStatus() == com.pos.restaurant.order.domain.OrderItemStatus.CANCELLED) {
                continue;
            }
            if (item.getItemStatus() == com.pos.restaurant.order.domain.OrderItemStatus.NEW && voidSlip) {
                continue;
            }
            MenuItem menuItem = item.getMenuItem();
            if (menuItem == null || menuItem.getMenuCategoryId() == null) {
                continue;
            }
            MenuCategory category = categories.computeIfAbsent(
                menuItem.getMenuCategoryId(),
                id -> menuCategoryRepository.findByIdAndCompanyId(id, order.getCompanyId()).orElse(null)
            );
            if (category == null) {
                continue;
            }
            if (!voidSlip && !category.isAutoPrint()) {
                continue;
            }
            String printer = category.getPrintPrinterName() == null ? "" : category.getPrintPrinterName().trim();
            if (printer.isEmpty()) {
                continue;
            }
            BigDecimal qty = qtyOverride != null && qtyOverride.containsKey(item.getId())
                ? qtyOverride.get(item.getId())
                : (item.getQuantity() == null ? BigDecimal.ONE : item.getQuantity());
            if (qty == null || qty.signum() <= 0) {
                continue;
            }
            byPrinter.computeIfAbsent(printer, key -> new ArrayList<>()).add(new PrintJobPayloads.CategoryBatchLine(
                item.getName(),
                qty,
                MenuPortionFormat.display(menuItem),
                WeightSaleSupport.kitchenNote(menuItem, item.getNote(), qty),
                modifierNames(modifiers.getOrDefault(item.getId(), List.of())),
                item.getUnitPrice() == null ? BigDecimal.ZERO : item.getUnitPrice()
            ));
            String baseTitle = category.getName() == null ? "" : category.getName();
            titleByPrinter.putIfAbsent(printer, voidSlip ? ("ОТКАЗ · " + baseTitle) : baseTitle);
        }

        String header = kitchenPlaceLine(order);
        UUID waiterUserId = order.getWaiterUserId();
        for (Map.Entry<String, List<PrintJobPayloads.CategoryBatchLine>> entry : byPrinter.entrySet()) {
            enqueue(order, PrintJobKind.CATEGORY_BATCH, new PrintJobPayloads.CategoryBatch(
                order.getId(),
                entry.getKey(),
                titleByPrinter.getOrDefault(entry.getKey(), voidSlip ? "ОТКАЗ" : ""),
                header,
                waiterUserId,
                entry.getValue()
            ));
        }
    }

    public void categorySlip(
        FloorOrder order,
        FloorOrderItem item,
        BigDecimal quantity,
        MenuCategory category
    ) {
        if (category == null || !category.isAutoPrint()) {
            return;
        }
        String printer = category.getPrintPrinterName() == null ? "" : category.getPrintPrinterName().trim();
        if (printer.isEmpty()) {
            return;
        }
        List<FloorOrderItemModifier> mods = itemModifierRepository.findByOrderItemIdIn(List.of(item.getId()));
        enqueue(order, PrintJobKind.CATEGORY_SLIP, new PrintJobPayloads.CategorySlip(
            order.getId(),
            item.getId(),
            quantity,
            category.getName(),
            printer,
            kitchenPlaceLine(order),
            order.getWaiterUserId(),
            item.getName(),
            MenuPortionFormat.display(item.getMenuItem()),
            WeightSaleSupport.kitchenNote(item.getMenuItem(), item.getNote(), quantity),
            modifierNames(mods),
            item.getUnitPrice() == null ? BigDecimal.ZERO : item.getUnitPrice()
        ));
    }

    private Map<UUID, List<FloorOrderItemModifier>> loadModifiers(List<FloorOrderItem> items) {
        List<UUID> ids = items.stream().map(FloorOrderItem::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<UUID, List<FloorOrderItemModifier>> out = new HashMap<>();
        for (FloorOrderItemModifier mod : itemModifierRepository.findByOrderItemIdIn(ids)) {
            out.computeIfAbsent(mod.getOrderItem().getId(), key -> new ArrayList<>()).add(mod);
        }
        return out;
    }

    private static List<String> modifierNames(List<FloorOrderItemModifier> mods) {
        return mods.stream()
            .map(FloorOrderItemModifier::getName)
            .filter(name -> name != null && !name.isBlank())
            .toList();
    }

    /** Guest bill place line. The bill body already appends №. */
    private static String ticketHeader(FloorOrder order) {
        return placeLine(order, false);
    }

    /** Kitchen / cancel slip: same place line plus the check number. */
    private static String kitchenPlaceLine(FloorOrder order) {
        return placeLine(order, true);
    }

    private static String placeLine(FloorOrder order, boolean withCheckNo) {
        OrderChannel channel = order.getChannel() == null ? OrderChannel.DINE_IN : order.getChannel();
        String no = String.valueOf(order.getOrderNo());
        if (channel == OrderChannel.TAKEAWAY) {
            return "TAKEAWAY #" + no;
        }
        if (channel == OrderChannel.DELIVERY) {
            return "DELIVERY #" + no;
        }
        String table = order.getTable() == null || order.getTable().getCode() == null
            ? "—"
            : order.getTable().getCode();
        String hall = order.getTable() == null || order.getTable().getHall() == null
            || order.getTable().getHall().getName() == null
            || order.getTable().getHall().getName().isBlank()
            ? null
            : order.getTable().getHall().getName().trim();
        String place = hall != null ? hall + " · Стол " + table : "Стол " + table;
        if (withCheckNo && order.getOrderNo() > 0) {
            return place + " · №" + no;
        }
        return place;
    }

    private void enqueue(FloorOrder order, PrintJobKind kind, Object payload) {
        repository.save(RestaurantPrintJob.builder()
            .companyId(order.getCompanyId())
            .storeId(order.getStoreId())
            .kind(kind)
            .payload(writeJson(payload))
            .build());
    }

    private String writeJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Print job payload serialization failed", e);
        }
    }
}
