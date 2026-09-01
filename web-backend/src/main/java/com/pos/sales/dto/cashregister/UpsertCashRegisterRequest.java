package com.pos.sales.dto.cashregister;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpsertCashRegisterRequest(
    @NotNull @Positive Integer storeId,
    @Positive Integer registerNumber,
    @Size(max = 100) String equipmentModel,
    @Size(max = 100) String equipmentSerial,
    @Size(max = 100) String fiscalCardId,
    @Size(max = 128) String deviceId,
    @Size(max = 200) String workstationName
) {}
