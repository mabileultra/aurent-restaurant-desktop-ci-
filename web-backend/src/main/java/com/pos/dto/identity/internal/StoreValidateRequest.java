package com.pos.dto.identity.internal;

import java.util.List;

public record StoreValidateRequest(
    Integer companyId,
    List<Integer> storeIds
) {}
