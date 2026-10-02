package com.pos.restaurant.shift.service;

import com.pos.restaurant.shift.dto.CashOpRequest;
import com.pos.restaurant.shift.dto.CashOpResponse;
import com.pos.restaurant.shift.dto.CloseShiftRequest;
import com.pos.restaurant.shift.dto.CloseShiftResult;
import com.pos.restaurant.shift.dto.OpenShiftRequest;
import com.pos.restaurant.shift.dto.ShiftReportResponse;
import com.pos.restaurant.shift.dto.ShiftResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RestaurantShiftService {

    Optional<ShiftResponse> findCurrent(Integer storeId);

    List<ShiftResponse> list(Integer storeId);

    ShiftResponse open(Integer storeId, OpenShiftRequest request);

    CloseShiftResult close(UUID shiftId, CloseShiftRequest request);

    ShiftReportResponse xReport(UUID shiftId);

    ShiftReportResponse zReportPreview(UUID shiftId);

    List<CashOpResponse> listCashOps(UUID shiftId);

    CashOpResponse postCashOp(UUID shiftId, CashOpRequest request);
}
