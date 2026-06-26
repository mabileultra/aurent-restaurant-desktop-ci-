package com.pos.restaurant.dto;

import com.pos.restaurant.domain.TableSessionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TableSessionResponse(
    UUID id,
    Integer tableId,
    String tableCode,
    String tableLabel,
    Integer storeId,
    UUID openedByUserId,
    String openedByName,
    UUID waiterUserId,
    String waiterName,
    int guestCount,
    TableSessionStatus status,
    UUID saleId,
    String notes,
    Instant openedAt,
    Instant closedAt,
    BigDecimal subtotal,
    int linesCount,
    List<TableSessionLineResponse> lines
) {}
