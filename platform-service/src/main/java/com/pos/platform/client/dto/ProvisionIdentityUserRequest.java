package com.pos.platform.client.dto;

import java.util.List;

public record ProvisionIdentityUserRequest(
    Integer companyId,
    String username,
    String email,
    String password,
    String firstName,
    String lastName,
    List<Integer> storeIds
) {}
