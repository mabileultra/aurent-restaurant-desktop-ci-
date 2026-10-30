package com.pos.sales.service;

import com.pos.sales.dto.cashregister.CashRegisterHeartbeatRequest;
import com.pos.sales.dto.cashregister.CashRegisterHeartbeatResponse;

public interface CashRegisterHeartbeatService {

    CashRegisterHeartbeatResponse heartbeat(Long id, CashRegisterHeartbeatRequest request);
}
