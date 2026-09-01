package com.pos.integrations.pharmacy.service.impl;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.integrations.pharmacy.dto.AdminPharmacyIntegrationResponse;
import com.pos.integrations.pharmacy.dto.CashierPharmacyIntegrationResponse;
import com.pos.integrations.pharmacy.dto.MarkingVerifyResponse;
import com.pos.integrations.pharmacy.dto.SavePharmacyIntegrationRequest;
import com.pos.integrations.pharmacy.entity.StorePharmacyIntegration;
import com.pos.integrations.pharmacy.repository.StorePharmacyIntegrationRepository;
import com.pos.integrations.pharmacy.service.PharmacyIntegrationSettingsService;
import com.pos.integrations.pharmacy.support.AslBelgisiMarkingClient;
import com.pos.integrations.pharmacy.support.PharmacyIntegrationDefaults;
import com.pos.repository.StoreRepository;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class PharmacyIntegrationSettingsServiceImpl implements PharmacyIntegrationSettingsService {

  private final StoreRepository storeRepository;
  private final StorePharmacyIntegrationRepository integrationRepository;
  private final TenantAccessSupport tenantAccess;
  private final CashierSaleSupport cashierSaleSupport;
  private final AslBelgisiMarkingClient aslBelgisiMarkingClient;

  @Override
  @Transactional(readOnly = true)
  public AdminPharmacyIntegrationResponse getAdminSettings(Integer storeId) {
    Store store = requireStore(storeId);
    tenantAccess.assertCanAccessStore(store);
    return toAdminResponse(store, findOrDefault(store));
  }

  @Override
  @Transactional
  public AdminPharmacyIntegrationResponse saveAdminSettings(Integer storeId, SavePharmacyIntegrationRequest request) {
    Store store = requireStore(storeId);
    tenantAccess.assertCanAccessStore(store);
    assertPharmacyStore(store);

    StorePharmacyIntegration entity = integrationRepository.findById(storeId)
      .orElseGet(() -> StorePharmacyIntegration.builder()
        .store(store)
        .storeId(storeId)
        .build());

    entity.setAslEnabled(request.aslEnabled());
    entity.setAslApiBaseUrl(normalizeBaseUrl(request.aslApiBaseUrl()));
    if (StringUtils.hasText(request.aslApiKey())) {
      entity.setAslApiKey(request.aslApiKey().trim());
    }
    entity.setDmedEnabled(request.dmedEnabled());
    entity.setDmedExternalId(trimToNull(request.dmedExternalId()));
    entity.setUpdatedAt(Instant.now());

    integrationRepository.save(entity);
    return toAdminResponse(store, entity);
  }

  @Override
  @Transactional(readOnly = true)
  public CashierPharmacyIntegrationResponse getCashierCapabilities(User cashier, Integer storeId) {
    Store store = cashierSaleSupport.requireStoreForSale(cashier, storeId);
    StorePharmacyIntegration settings = findOrDefault(store);
    boolean aslEnabled = settings.isAslEnabled();
    return new CashierPharmacyIntegrationResponse(
      aslEnabled,
      settings.isDmedEnabled(),
      PharmacyIntegrationDefaults.ASL_PORTAL_URL,
      PharmacyIntegrationDefaults.DMED_PORTAL_URL,
      PharmacyIntegrationDefaults.IKPU_PORTAL_URL
    );
  }

  @Override
  @Transactional(readOnly = true)
  public MarkingVerifyResponse verifyMarking(User cashier, Integer storeId, String code) {
    Store store = cashierSaleSupport.requireStoreForSale(cashier, storeId);
    StorePharmacyIntegration settings = findOrDefault(store);
    if (!settings.isAslEnabled()) {
      throw new BadRequestException("ASL Belgisi marking is disabled for this store");
    }
    String baseUrl = normalizeBaseUrl(settings.getAslApiBaseUrl());
    return aslBelgisiMarkingClient.verify(baseUrl, settings.getAslApiKey(), code);
  }

  @Override
  public void assertPharmacyStore(Store store) {
    if (store == null) {
      throw new BadRequestException("Store is required");
    }
    String type = store.getBusinessType();
    if (!StringUtils.hasText(type) || !"PHARMACY".equalsIgnoreCase(type.trim())) {
      throw new BadRequestException("Pharmacy integrations are available only for PHARMACY stores");
    }
  }

  private Store requireStore(Integer storeId) {
    return storeRepository.findById(storeId)
      .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
  }

  private StorePharmacyIntegration findOrDefault(Store store) {
    return integrationRepository.findById(store.getId())
      .orElseGet(() -> StorePharmacyIntegration.builder()
        .store(store)
        .storeId(store.getId())
        .aslEnabled(false)
        .aslApiBaseUrl(PharmacyIntegrationDefaults.ASL_API_BASE_URL)
        .dmedEnabled(true)
        .build());
  }

  private AdminPharmacyIntegrationResponse toAdminResponse(Store store, StorePharmacyIntegration entity) {
    String apiKey = entity.getAslApiKey();
    return new AdminPharmacyIntegrationResponse(
      store.getId(),
      entity.isAslEnabled(),
      normalizeBaseUrl(entity.getAslApiBaseUrl()),
      StringUtils.hasText(apiKey),
      maskApiKey(apiKey),
      entity.isDmedEnabled(),
      entity.getDmedExternalId()
    );
  }

  private String normalizeBaseUrl(String baseUrl) {
    if (!StringUtils.hasText(baseUrl)) {
      return PharmacyIntegrationDefaults.ASL_API_BASE_URL;
    }
    String trimmed = baseUrl.trim();
    while (trimmed.endsWith("/")) {
      trimmed = trimmed.substring(0, trimmed.length() - 1);
    }
    return trimmed;
  }

  private String trimToNull(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    return value.trim();
  }

  private String maskApiKey(String apiKey) {
    if (!StringUtils.hasText(apiKey)) {
      return null;
    }
    String trimmed = apiKey.trim();
    if (trimmed.length() <= 4) {
      return "****";
    }
    return "****" + trimmed.substring(trimmed.length() - 4);
  }
}
