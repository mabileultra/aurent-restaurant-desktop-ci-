package com.pos.dto.identity.internal;

import java.util.List;

public record StoreValidateResponse(
    boolean valid,
    List<Integer> validStoreIds
) {}
