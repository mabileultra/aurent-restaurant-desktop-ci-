package com.pos.sales.dto.cashregister;

import jakarta.validation.constraints.Size;

public record CashRegisterHeartbeatRequest(
    @Size(max = 64) String appVersion,
    @Size(max = 200) String workstationName
) {
}
