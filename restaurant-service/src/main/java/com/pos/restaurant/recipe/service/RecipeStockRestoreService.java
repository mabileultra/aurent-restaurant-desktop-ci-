package com.pos.restaurant.recipe.service;

import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.payment.entity.FloorOrderPayment;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface RecipeStockRestoreService {

    void restorePaidOrder(FloorOrder order, List<FloorOrderItem> items, FloorOrderPayment payment);

    void restorePaidItems(FloorOrder order, List<FloorOrderItem> items, FloorOrderPayment payment, String eventKey);
}

