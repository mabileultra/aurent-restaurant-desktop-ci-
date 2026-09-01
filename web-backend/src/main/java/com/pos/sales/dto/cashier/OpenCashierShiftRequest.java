package com.pos.sales.dto.cashier;

import com.pos.sales.dto.cashregister.RegisterTerminalRequest;

public record OpenCashierShiftRequest(
    RegisterTerminalRequest terminal
) {}
