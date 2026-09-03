package com.pos.integrations.restaurant.service;

import com.pos.integrations.restaurant.dto.RestaurantStockConsumeRequest;

public interface RestaurantStockConsumeService {

    void consume(RestaurantStockConsumeRequest request);
}
