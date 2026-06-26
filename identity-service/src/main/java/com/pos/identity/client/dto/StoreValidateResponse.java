package com.pos.identity.client.dto;

import java.util.List;

public record StoreValidateResponse(
    boolean valid,
    List<Integer> validStoreIds
) {}
