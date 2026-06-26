package com.pos.restaurant.service;

import com.pos.restaurant.dto.DiningTableResponse;
import com.pos.restaurant.dto.SaveDiningTableRequest;
import com.pos.restaurant.dto.UpdateDiningTablesLayoutRequest;

import java.util.List;

public interface DiningTableService {

    List<DiningTableResponse> listByHall(Integer hallId);

    DiningTableResponse create(Integer hallId, SaveDiningTableRequest request);

    DiningTableResponse update(Integer tableId, SaveDiningTableRequest request);

    List<DiningTableResponse> updateLayout(Integer hallId, UpdateDiningTablesLayoutRequest request);

    void deactivate(Integer tableId);
}
