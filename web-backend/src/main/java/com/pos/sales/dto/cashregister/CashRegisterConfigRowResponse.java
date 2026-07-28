package com.pos.sales.dto.cashregister;

public record CashRegisterConfigRowResponse(
    Long id,
    String name,
    boolean lockedDefault,
    int storeCount,
    int registerCount,
    int categoryCount
) {}
