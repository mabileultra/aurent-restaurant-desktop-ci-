package com.pos.restaurant.revenue.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.revenue.domain.RevenueOutboxChannel;
import com.pos.restaurant.revenue.entity.RevenueOutbox;
import com.pos.restaurant.revenue.service.RestaurantRefundPublicationService;
import com.pos.restaurant.revenue.service.RevenueOutboxDispatchService;
import com.pos.restaurant.revenue.service.RevenueOutboxService;
import com.pos.restaurant.revenue.support.RestaurantRefundPayloadFactory;
import com.pos.restaurant.revenue.support.RestaurantSaleCompletedFactory;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.kafka.KafkaTopics;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RestaurantRefundPublicationServiceImpl implements RestaurantRefundPublicationService {

    private final RevenueOutboxService outboxService;
    private final RevenueOutboxDispatchService outboxDispatchService;
    private final RestaurantSaleCompletedFactory saleCompletedFactory;
    private final ObjectMapper objectMapper;

    @Override
    public void publish(FloorOrder order, List<FloorOrderItem> items, FloorOrderPayment payment) {
        publishPartial(order, items, payment, payment.getAmount(), order.getId().toString());
    }

    @Override
    public void publishPartial(
        FloorOrder order,
        List<FloorOrderItem> returnedSlice,
        FloorOrderPayment payment,
        BigDecimal refundAmount,
        String eventKey
    ) {
        UUID returnEventId = UUID.randomUUID();
        SaleCompletedEvent saleEvent = saleCompletedFactory.fromRefundedOrder(order, returnedSlice, payment);
        RevenueOutbox saleRow = outboxService.enqueue(
            RevenueOutboxChannel.SALE_COMPLETED,
            KafkaTopics.SALES_COMPLETED,
            order.getId().toString(),
            "rst-sale-refund:" + eventKey,
            writeJson(saleEvent)
        );
        RevenueOutbox financeRow = outboxService.enqueue(
            RevenueOutboxChannel.REFUND_EXPENSE,
            KafkaTopics.FINANCE_INTEGRATION,
            "rst-refund:" + eventKey,
            "rst-refund:" + returnEventId,
            writeJson(RestaurantRefundPayloadFactory.fromPaidOrder(order, payment, returnEventId, refundAmount))
        );
        outboxDispatchService.dispatchAfterCommit(saleRow.getId());
        outboxDispatchService.dispatchAfterCommit(financeRow.getId());
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Refund payload serialization failed", ex);
        }
    }
}
