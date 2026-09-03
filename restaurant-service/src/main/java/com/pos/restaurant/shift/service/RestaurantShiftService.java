package com.pos.restaurant.shift.service;

import com.pos.restaurant.shift.dto.CloseShiftRequest;
import com.pos.restaurant.shift.dto.OpenShiftRequest;
import com.pos.restaurant.shift.dto.ShiftResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RestaurantShiftService {

    Optional<ShiftResponse> findCurrent(Integer storeId);

    List<ShiftResponse> list(Integer storeId);

    ShiftResponse open(Integer storeId, OpenShiftRequest request);

    ShiftResponse close(UUID shiftId, CloseShiftRequest request);
}
