package com.pos.sales.service.cashier;

import com.pos.sales.dto.cashier.ShiftCashMovementRequest;
import com.pos.sales.dto.cashier.ShiftCashMovementResponse;

import java.util.UUID;

public interface ShiftCashMovementService {

    ShiftCashMovementResponse cashIn(UUID shiftId, ShiftCashMovementRequest request);

    ShiftCashMovementResponse cashOut(UUID shiftId, ShiftCashMovementRequest request);
}
