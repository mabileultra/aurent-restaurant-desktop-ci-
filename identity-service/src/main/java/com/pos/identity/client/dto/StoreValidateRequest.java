package com.pos.identity.client.dto;

import java.util.List;

public record StoreValidateRequest(
    Integer companyId,
    List<Integer> storeIds
) {}
