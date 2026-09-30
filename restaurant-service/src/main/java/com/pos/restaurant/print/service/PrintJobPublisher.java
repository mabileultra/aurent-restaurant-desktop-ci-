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
import com.pos.restaurant.print.domain.PrintJobKind;
import com.pos.restaurant.print.entity.RestaurantPrintJob;
import com.pos.restaurant.print.repository.RestaurantPrintJobRepository;
import com.pos.restaurant.print.support.PrintJobPayloads;
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
    private final ObjectMapper objectMapper;

    public void guestBill(FloorOrder order) {
        enqueue(order, PrintJobKind.GUEST_BILL, new PrintJobPayloads.GuestBill(order.getId()));
    }

    public void kitchenSend(FloorOrder order, List<UUID> itemIds) {
        if (itemIds == null || itemIds.isEmpty()) {
            return;
        }
        enqueue(order, PrintJobKind.KITCHEN_SEND, new PrintJobPayloads.KitchenSend(order.getId(), itemIds));
    }

    /**
     * When KDS board is off: one batch job per Windows printer for all sent auto-print lines.
     */
    public void categorySlipsForItems(FloorOrder order, List<FloorOrderItem> items) {
        enqueueCategoryBatches(order, items, false);
    }

    /** Cancel / refuse: void slip to the same section printers that received the dishes. */
    public void voidSlipsForItems(FloorOrder order, List<FloorOrderItem> items) {
        enqueueCategoryBatches(order, items, true);
    }

    private void enqueueCategoryBatches(FloorOrder order, List<FloorOrderItem> items, boolean voidSlip) {
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
            BigDecimal qty = item.getQuantity() == null ? BigDecimal.ONE : item.getQuantity();
            byPrinter.computeIfAbsent(printer, key -> new ArrayList<>()).add(new PrintJobPayloads.CategoryBatchLine(
                item.getName(),
                qty,
                MenuPortionFormat.display(menuItem),
                item.getNote(),
                modifierNames(modifiers.getOrDefault(item.getId(), List.of()))
            ));
            String baseTitle = category.getName() == null ? "" : category.getName();
            titleByPrinter.putIfAbsent(printer, voidSlip ? ("ОТКАЗ · " + baseTitle) : baseTitle);
        }

        String header = ticketHeader(order);
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
            ticketHeader(order),
            order.getWaiterUserId(),
            item.getName(),
            MenuPortionFormat.display(item.getMenuItem()),
            item.getNote(),
            modifierNames(mods)
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

    private static String ticketHeader(FloorOrder order) {
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
        return "Стол " + table + " · №" + no;
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
