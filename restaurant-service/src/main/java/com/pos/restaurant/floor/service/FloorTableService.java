package com.pos.restaurant.floor.service;

import com.pos.restaurant.floor.dto.SaveTableRequest;
import com.pos.restaurant.floor.dto.TableResponse;
import com.pos.restaurant.floor.dto.UpdateTableLayoutRequest;

import java.util.List;

public interface FloorTableService {

    List<TableResponse> listByHall(Integer hallId);

    TableResponse create(Integer hallId, SaveTableRequest request);

    TableResponse update(Integer tableId, SaveTableRequest request);

    List<TableResponse> updateLayout(Integer hallId, UpdateTableLayoutRequest request);

    TableResponse markReady(Integer tableId);

    void deactivate(Integer tableId);
}
