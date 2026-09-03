package com.pos.restaurant.service;

import com.pos.restaurant.dto.BookingTableOptionResponse;
import com.pos.restaurant.dto.DiningHallResponse;
import com.pos.restaurant.dto.SaveDiningHallRequest;

import java.util.List;

public interface DiningHallService {

    List<DiningHallResponse> listByStore(Integer storeId);

    List<BookingTableOptionResponse> listBookingTables(Integer storeId);

    DiningHallResponse create(Integer storeId, SaveDiningHallRequest request);

    DiningHallResponse update(Integer hallId, SaveDiningHallRequest request);

    void deactivate(Integer hallId);
}
