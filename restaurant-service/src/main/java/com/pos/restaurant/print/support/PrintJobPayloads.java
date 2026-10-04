package com.pos.restaurant.print.support;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class PrintJobPayloads {

    private PrintJobPayloads() {}

    public record GuestBill(UUID orderId) {}

    /** note = kitchen text for this fire (weight delta); null → print relay falls back to order line note. */
    public record KitchenSendLine(UUID itemId, BigDecimal quantity, String note) {
        public KitchenSendLine(UUID itemId, BigDecimal quantity) {
            this(itemId, quantity, null);
        }
    }

    /**
     * itemIds kept for older print relays; prefer lines when present (reorder delta qty).
     * voidSlip → station printers print «ОТКАЗ» (kitchen board path).
     */
    public record KitchenSend(UUID orderId, List<UUID> itemIds, List<KitchenSendLine> lines, boolean voidSlip) {
        public KitchenSend(UUID orderId, List<UUID> itemIds, List<KitchenSendLine> lines) {
            this(orderId, itemIds, lines, false);
        }

        public KitchenSend(UUID orderId, List<UUID> itemIds) {
            this(orderId, itemIds, null, false);
        }
    }

    public record CategorySlip(
        UUID orderId,
        UUID orderItemId,
        BigDecimal quantity,
        String categoryName,
        String printerName,
        String header,
        UUID waiterUserId,
        String itemName,
        String portionText,
        String note,
        List<String> modifiers
    ) {}

    /** Several category lines to one Windows printer (one physical cut). */
    public record CategoryBatch(
        UUID orderId,
        String printerName,
        String title,
        String header,
        UUID waiterUserId,
        List<CategoryBatchLine> lines
    ) {}

    public record CategoryBatchLine(
        String name,
        BigDecimal quantity,
        String portionText,
        String note,
        List<String> modifiers
    ) {}

    /** Full table/order cancel — printed on the cashier receipt printer. */
    public record OrderCancel(
        UUID orderId,
        String header,
        UUID waiterUserId,
        List<CategoryBatchLine> lines
    ) {}
}
