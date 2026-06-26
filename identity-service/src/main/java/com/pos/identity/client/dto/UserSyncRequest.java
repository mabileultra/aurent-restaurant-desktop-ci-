package com.pos.identity.client.dto;

import java.util.List;
import java.util.UUID;

public record UserSyncRequest(
    String operation,
    UUID id,
    String username,
    String email,
    String passwordHash,
    String pinDigest,
    String fullName,
    String firstName,
    String lastName,
    String patronymic,
    String role,
    Integer companyId,
    List<Integer> storeIds,
    boolean active,
    boolean moduleAccessCustom
) {}
