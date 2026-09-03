package com.pos.restaurant.floor.service;

import com.pos.restaurant.floor.dto.HallResponse;
import com.pos.restaurant.floor.dto.SaveHallRequest;

import java.util.List;

public interface FloorHallService {

    List<HallResponse> listByStore(Integer storeId);

    HallResponse create(Integer storeId, SaveHallRequest request);

    HallResponse update(Integer hallId, SaveHallRequest request);

    void deactivate(Integer hallId);
}
