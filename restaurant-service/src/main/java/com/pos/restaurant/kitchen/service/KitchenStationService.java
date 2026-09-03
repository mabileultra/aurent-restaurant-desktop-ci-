package com.pos.restaurant.kitchen.service;

import com.pos.restaurant.kitchen.dto.SaveStationRequest;
import com.pos.restaurant.kitchen.dto.StationResponse;

import java.util.List;
import java.util.UUID;

public interface KitchenStationService {

    List<StationResponse> list(Integer storeId, boolean activeOnly);

    StationResponse create(Integer storeId, SaveStationRequest request);

    StationResponse update(UUID stationId, SaveStationRequest request);

    void deactivate(UUID stationId);
}
