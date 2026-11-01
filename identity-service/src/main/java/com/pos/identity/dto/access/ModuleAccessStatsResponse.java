package com.pos.identity.dto.access;

import java.util.List;

public record ModuleAccessStatsResponse(
    List<ModuleAccessBusinessTypeStats> businessTypes
) {
}
