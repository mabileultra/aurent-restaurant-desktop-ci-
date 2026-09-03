package com.pos.restaurant.recipe.service;

import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.payment.entity.FloorOrderPayment;

import java.util.List;

public interface RecipeConsumePublicationService {

    void publishPaidOrder(FloorOrder order, List<FloorOrderItem> items, FloorOrderPayment payment);
}
