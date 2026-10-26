package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderLookup {

    private final FloorOrderRepository orderRepository;
    private final FloorTenantSupport tenantSupport;

    public FloorOrder require(UUID orderId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return orderRepository.findByIdAndCompanyId(orderId, companyId)
            .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
    }

    public FloorOrder requireOpen(UUID orderId) {
        FloorOrder order = require(orderId);
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Order is not open");
        }
        return order;
    }

    public FloorOrder requireActive(UUID orderId) {
        FloorOrder order = require(orderId);
        if (order.getStatus() != OrderStatus.OPEN && order.getStatus() != OrderStatus.BILLING) {
            throw new BusinessException("Order is not active");
        }
        return order;
    }

    public FloorOrder requireClosed(UUID orderId) {
        FloorOrder order = require(orderId);
        if (order.getStatus() != OrderStatus.CLOSED) {
            throw new BusinessException("Можно вернуть только оплаченный заказ");
        }
        return order;
    }

    public FloorOrder requireBilling(UUID orderId) {
        FloorOrder order = require(orderId);
        if (order.getStatus() != OrderStatus.BILLING) {
            throw new BusinessException("Bill has not been requested");
        }
        return order;
    }

    /** Hall checks stay on BILLING. A takeaway walk-in can be paid while still OPEN. */
    public FloorOrder requirePayable(UUID orderId) {
        FloorOrder order = require(orderId);
        if (order.getStatus() == OrderStatus.BILLING) {
            return order;
        }
        if (order.getStatus() == OrderStatus.OPEN && order.getChannel() == OrderChannel.TAKEAWAY) {
            return order;
        }
        throw new BusinessException("Bill has not been requested");
    }
}
