package com.pos.restaurant.print.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.menu.entity.MenuCategory;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.print.domain.PrintJobKind;
import com.pos.restaurant.print.entity.RestaurantPrintJob;
import com.pos.restaurant.print.repository.RestaurantPrintJobRepository;
import com.pos.restaurant.print.support.PrintJobPayloads;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PrintJobPublisher {

    private final RestaurantPrintJobRepository repository;
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
        enqueue(order, PrintJobKind.CATEGORY_SLIP, new PrintJobPayloads.CategorySlip(
            order.getId(),
            item.getId(),
            quantity,
            category.getName(),
            printer
        ));
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
