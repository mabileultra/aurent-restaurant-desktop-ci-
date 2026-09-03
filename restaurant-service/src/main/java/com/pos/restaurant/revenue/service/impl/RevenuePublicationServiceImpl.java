package com.pos.restaurant.revenue.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.revenue.domain.RevenueOutboxChannel;
import com.pos.restaurant.revenue.entity.RevenueOutbox;
import com.pos.restaurant.revenue.service.RevenueOutboxService;
import com.pos.restaurant.revenue.service.RevenuePublicationService;
import com.pos.restaurant.revenue.support.RestaurantFinanceIncomeFactory;
import com.pos.restaurant.revenue.support.RestaurantSaleCompletedFactory;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.kafka.KafkaTopics;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RevenuePublicationServiceImpl implements RevenuePublicationService {

    private final RevenueOutboxService outboxService;
    private final RestaurantSaleCompletedFactory saleCompletedFactory;
    private final OrderTotals orderTotals;
    private final ObjectMapper objectMapper;

    @Override
    public void publishPaidOrder(FloorOrder order, List<FloorOrderItem> items, FloorOrderPayment payment) {
        SaleCompletedEvent saleEvent = saleCompletedFactory.fromPaidOrder(order, items, payment);
        RevenueOutbox saleRow = outboxService.enqueue(
            RevenueOutboxChannel.SALE_COMPLETED,
            KafkaTopics.SALES_COMPLETED,
            order.getId().toString(),
            "rst-sale:" + order.getId(),
            writeJson(saleEvent)
        );
        RevenueOutbox financeRow = outboxService.enqueue(
            RevenueOutboxChannel.FINANCE_INCOME,
            KafkaTopics.FINANCE_INTEGRATION,
            "rst-finance:" + order.getId(),
            "rst-finance:" + order.getId(),
            writeJson(RestaurantFinanceIncomeFactory.fromPaidOrder(order, payment, orderTotals.billable(items)))
        );
        scheduleSend(saleRow.getId());
        scheduleSend(financeRow.getId());
    }

    private void scheduleSend(UUID outboxId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            outboxService.trySend(outboxId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                outboxService.trySend(outboxId);
            }
        });
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Revenue payload serialization failed", ex);
        }
    }
}
