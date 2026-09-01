package com.pos.integrations.pharmacy.dto;

public record AdminPharmacyIntegrationResponse(
  Integer storeId,
  boolean aslEnabled,
  String aslApiBaseUrl,
  boolean hasAslApiKey,
  String aslApiKeyMasked,
  boolean dmedEnabled,
  String dmedExternalId
) {
}
