package com.pos.sales.dto.cashregister;

public record RegisterTerminalResponse(
    Long cashRegisterId,
    Integer registerNumber,
    String equipmentSerial,
    String deviceId,
    boolean created
) {}
