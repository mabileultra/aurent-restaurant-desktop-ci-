package com.pos.integrations.pharmacy.dto;

public record CashierPharmacyIntegrationResponse(
  boolean aslMarkingEnabled,
  boolean dmedEnabled,
  String aslPortalUrl,
  String dmedPortalUrl,
  String ikpuPortalUrl
) {
}
