package com.pos.sales.dto.cashregister;

public record CashRegisterRowResponse(
    Long id,
    Integer storeId,
    String storeName,
    Integer registerNumber,
    String equipmentModel,
    String equipmentSerial,
    String fiscalCardId,
    String deviceId,
    String workstationName,
    String status
) {}
