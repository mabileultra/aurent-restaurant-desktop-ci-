package com.pos.sales.dto.cashregister;

import jakarta.validation.constraints.Size;

public record RegisterTerminalRequest(
    @Size(max = 128) String deviceId,
    @Size(max = 100) String equipmentSerial,
    @Size(max = 100) String equipmentModel,
    @Size(max = 100) String fiscalCardId,
    @Size(max = 200) String workstationName
) {}
