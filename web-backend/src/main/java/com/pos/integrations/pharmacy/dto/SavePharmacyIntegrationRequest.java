package com.pos.integrations.pharmacy.dto;

public record SavePharmacyIntegrationRequest(
  boolean aslEnabled,
  String aslApiBaseUrl,
  String aslApiKey,
  boolean dmedEnabled,
  String dmedExternalId
) {
}
