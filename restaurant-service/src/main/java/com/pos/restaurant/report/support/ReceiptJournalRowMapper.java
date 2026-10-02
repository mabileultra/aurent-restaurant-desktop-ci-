package com.pos.restaurant.report.support;

import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.report.domain.ReceiptStatus;
import com.pos.restaurant.report.dto.ReceiptJournalRow;

import java.math.BigDecimal;

public final class ReceiptJournalRowMapper {

    private ReceiptJournalRowMapper() {
    }

    /**
     * @param returnedAmount value of returned dishes for a partially refunded order, or null
     */
    public static ReceiptJournalRow toRow(FloorOrderPayment payment, BigDecimal returnedAmount) {
        FloorOrder order = payment.getOrder();
        FloorTable table = order.getTable();
        BigDecimal total = ReceiptJournalLoader.money(payment.getAmount());

        ReceiptStatus status;
        BigDecimal refund;
        if (order.getStatus() == OrderStatus.REFUNDED) {
            status = ReceiptStatus.REFUNDED;
            refund = total;
        } else if (returnedAmount != null && returnedAmount.signum() > 0) {
            status = ReceiptStatus.PARTIAL_REFUND;
            refund = ReceiptJournalLoader.money(returnedAmount).min(total);
        } else {
            status = ReceiptStatus.PAID;
            refund = BigDecimal.ZERO.setScale(2);
        }

        BigDecimal service = order.getServiceAmount() != null
            ? order.getServiceAmount()
            : order.getCommissionAmount();

        return new ReceiptJournalRow(
            order.getId(),
            order.getOrderNo(),
            payment.getPaidAt(),
            order.getChannel(),
            table == null || table.getHall() == null ? null : table.getHall().getName(),
            table == null ? null : table.getCode(),
            order.getGuestCount(),
            order.getWaiterUserId(),
            payment.getPaidByUserId(),
            payment.getMethod(),
            payment.getCardType(),
            ReceiptJournalLoader.money(order.getDiscountAmount()),
            ReceiptJournalLoader.money(service),
            total,
            ReceiptJournalLoader.money(payment.getCashAmount()),
            ReceiptJournalLoader.money(payment.getCardAmount()),
            refund,
            total.subtract(refund).max(BigDecimal.ZERO),
            status,
            order.getClientName(),
            payment.getDebtPhone(),
            payment.getDebtComment(),
            payment.getAdvancePaid(),
            payment.getDebtRemaining()
        );
    }
}
