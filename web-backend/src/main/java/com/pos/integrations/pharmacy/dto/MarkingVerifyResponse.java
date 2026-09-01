package com.pos.integrations.pharmacy.dto;

import java.util.Map;

public record MarkingVerifyResponse(
  boolean found,
  String code,
  String status,
  String gtin,
  String productName,
  String expirationDate,
  String batch,
  String ownerInn,
  Map<String, Object> details
) {
}
