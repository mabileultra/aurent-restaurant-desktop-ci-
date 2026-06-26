package com.pos.identity.client.dto;

import java.util.List;
import java.util.UUID;

public record UserCredentialsEmailRequest(
    UUID id,
    String username,
    String email,
    String fullName,
    String role,
    Integer companyId,
    List<Integer> storeIds,
    String plainPassword
) {}
