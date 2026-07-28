package com.pos.sales.dto.cashier;

public record FinalizeZReportResponse(
    ShiftReportResponse report,
    CashierShiftResponse newShift
) {}
