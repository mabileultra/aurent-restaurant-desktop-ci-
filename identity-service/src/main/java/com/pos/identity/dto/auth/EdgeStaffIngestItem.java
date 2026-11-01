package com.pos.identity.dto.auth;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Hall → cloud staff upsert (hashes only). */
public record EdgeStaffIngestItem(
    UUID userId,
    String username,
    String email,
    String fullName,
    String role,
    String passwordHash,
    String pinHash,
    List<Integer> storeIds,
    Boolean active,
    Instant updatedAt
) {}
