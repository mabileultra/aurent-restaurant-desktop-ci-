package com.pos.identity.dto.access;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ModuleAccessHistoryItem(
    UUID id,
    Instant createdAt,
    UUID actorUserId,
    String actorName,
    String action,
    UUID targetUserId,
    String targetUsername,
    String targetFullName,
    String strategy,
    boolean beforeCustom,
    boolean afterCustom,
    Map<String, Boolean> beforeModules,
    Map<String, Boolean> afterModules,
    Instant revertedAt,
    boolean canRevert
) {}
