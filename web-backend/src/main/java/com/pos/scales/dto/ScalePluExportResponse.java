package com.pos.scales.dto;

import com.pos.scales.domain.ScaleLabelProfile;

import java.time.Instant;
import java.util.List;

public record ScalePluExportResponse(
    ScaleLabelProfile labelProfile,
    Instant exportedAt,
    int total,
    int withPlu,
    List<ScalePluExportItemDto> items
) {}
