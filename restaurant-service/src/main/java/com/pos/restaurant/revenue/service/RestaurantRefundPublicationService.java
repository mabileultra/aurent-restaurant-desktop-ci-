package com.pos.restaurant.revenue.service;

import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.payment.entity.FloorOrderPayment;

import java.util.List;

public interface RestaurantRefundPublicationService {

    void publish(FloorOrder order, List<FloorOrderItem> items, FloorOrderPayment payment);
}
