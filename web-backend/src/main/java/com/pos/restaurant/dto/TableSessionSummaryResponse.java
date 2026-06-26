package com.pos.restaurant.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TableSessionSummaryResponse(
    UUID id,
    int guestCount,
    String waiterName,
    Instant openedAt,
    int linesCount,
    BigDecimal subtotal,
    List<String> previewItems,
    int moreItemsCount
) {}
