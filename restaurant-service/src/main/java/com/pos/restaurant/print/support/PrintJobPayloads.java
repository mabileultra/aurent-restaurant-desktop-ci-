package com.pos.restaurant.print.support;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class PrintJobPayloads {

    private PrintJobPayloads() {}

    public record GuestBill(UUID orderId) {}

    public record KitchenSend(UUID orderId, List<UUID> itemIds) {}

    public record CategorySlip(
        UUID orderId,
        UUID orderItemId,
        BigDecimal quantity,
        String categoryName,
        String printerName
    ) {}
}
