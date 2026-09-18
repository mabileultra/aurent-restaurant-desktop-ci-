package com.pos.restaurant.revenue.support;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.event.SaleLineSnapshot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RestaurantSaleCompletedFactory {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");
    private static final String CATEGORY = "Restaurant";

    private final OrderTotals orderTotals;

    public SaleCompletedEvent fromPaidOrder(FloorOrder order, List<FloorOrderItem> items, FloorOrderPayment payment) {
        List<FloorOrderItem> billable = items.stream()
            .filter(item -> item.getItemStatus() != OrderItemStatus.CANCELLED)
            .toList();
        List<SaleLineSnapshot> lines = billable.stream().map(this::toLine).toList();
        BigDecimal total = orderTotals.billable(items);
        boolean card = payment.getMethod() == PaymentMethod.CARD;
        return new SaleCompletedEvent(
            order.getCompanyId(),
            order.getStoreId(),
            order.getId(),
            receiptNumber(order),
            total,
            card ? BigDecimal.ZERO : payment.getAmount(),
            card ? payment.getAmount() : BigDecimal.ZERO,
            payment.getMethod().name(),
            LocalDate.ofInstant(order.getClosedAt() != null ? order.getClosedAt() : payment.getPaidAt(), ZONE),
            payment.getPaidByUserId(),
            lines.stream().mapToLong(SaleLineSnapshot::quantity).sum(),
            null,
            null,
            "COMPLETED",
            lines,
            BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
        );
    }

    public SaleCompletedEvent fromRefundedOrder(FloorOrder order, List<FloorOrderItem> items, FloorOrderPayment payment) {
        List<SaleLineSnapshot> lines = items.stream()
            .filter(item -> item.getItemStatus() != OrderItemStatus.CANCELLED)
            .map(this::toReturnedLine)
            .toList();
        return new SaleCompletedEvent(
            order.getCompanyId(),
            order.getStoreId(),
            order.getId(),
            receiptNumber(order),
            BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
            BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
            BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
            payment.getMethod().name(),
            LocalDate.ofInstant(order.getClosedAt() != null ? order.getClosedAt() : payment.getPaidAt(), ZONE),
            payment.getPaidByUserId(),
            0L,
            null,
            null,
            "REFUNDED",
            lines,
            orderTotals.billable(items)
        );
    }

    public static String receiptNumber(FloorOrder order) {
        return "RST-" + order.getStoreId() + "-" + order.getOrderNo();
    }

    private SaleLineSnapshot toReturnedLine(FloorOrderItem item) {
        SaleLineSnapshot sold = toLine(item);
        return new SaleLineSnapshot(
            sold.productId(),
            sold.productName(),
            sold.sku(),
            sold.barcode(),
            sold.categoryId(),
            sold.categoryName(),
            sold.quantity(),
            sold.quantity(),
            BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
            BigDecimal.ZERO
        );
    }

    private SaleLineSnapshot toLine(FloorOrderItem item) {
        UUID menuItemId = item.getMenuItem() == null ? null : item.getMenuItem().getId();
        BigDecimal revenue = orderTotals.lineTotal(item);
        return new SaleLineSnapshot(
            menuItemId,
            item.getName(),
            null,
            null,
            null,
            CATEGORY,
            reportableQty(item.getQuantity()),
            0L,
            revenue,
            BigDecimal.ZERO
        );
    }

    static long reportableQty(BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            return 0L;
        }
        long rounded = quantity.setScale(0, RoundingMode.HALF_UP).longValue();
        return rounded == 0L ? 1L : rounded;
    }
}
