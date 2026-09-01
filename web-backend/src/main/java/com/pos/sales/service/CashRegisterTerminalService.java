package com.pos.sales.service;

import com.pos.sales.dto.cashregister.RegisterTerminalRequest;
import com.pos.sales.dto.cashregister.RegisterTerminalResponse;
import com.pos.sales.entity.CashRegister;

public interface CashRegisterTerminalService {

    RegisterTerminalResponse registerForStore(Integer storeId, RegisterTerminalRequest request);

    CashRegister resolveActiveRegister(Integer storeId, RegisterTerminalRequest request);
}
