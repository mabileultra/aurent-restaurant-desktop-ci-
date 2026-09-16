package com.pos.integrations.restaurant.service;

import com.pos.integrations.restaurant.dto.RestaurantStockConsumeRequest;

public interface RestaurantStockRestoreService {

    void restore(RestaurantStockConsumeRequest request);
}
