package com.pos.integrations.pharmacy.service.impl;

import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawItemResult;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawRequest;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawResponse;
import com.pos.integrations.pharmacy.entity.StorePharmacyIntegration;
import com.pos.integrations.pharmacy.repository.StorePharmacyIntegrationRepository;
import com.pos.integrations.pharmacy.service.PharmacyIntegrationSettingsService;
import com.pos.integrations.pharmacy.service.PharmacyMarkingWithdrawService;
import com.pos.integrations.pharmacy.support.AslApiKeySupport;
import com.pos.integrations.pharmacy.support.AslBelgisiWithdrawClient;
import com.pos.integrations.pharmacy.support.PharmacyIntegrationDefaults;
import com.pos.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PharmacyMarkingWithdrawServiceImpl implements PharmacyMarkingWithdrawService {

  private final StoreRepository storeRepository;
  private final StorePharmacyIntegrationRepository integrationRepository;
  private final PharmacyIntegrationSettingsService settingsService;
  private final AslBelgisiWithdrawClient withdrawClient;

  @Override
  @Transactional(readOnly = true)
  public MarkingWithdrawResponse withdraw(MarkingWithdrawRequest request) {
    if (request == null || request.storeId() == null) {
      throw new BadRequestException("storeId is required");
    }
    Store store = storeRepository.findById(request.storeId())
      .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
    settingsService.assertAslMarkingStore(store);

    StorePharmacyIntegration settings = integrationRepository.findById(store.getId())
      .orElseGet(() -> StorePharmacyIntegration.builder()
        .store(store)
        .storeId(store.getId())
        .aslEnabled(false)
        .aslApiBaseUrl(PharmacyIntegrationDefaults.ASL_API_BASE_URL)
        .build());

    boolean fiscalConfirmed = Boolean.TRUE.equals(request.fiscalConfirmed());
    List<String> codes = distinctCodes(request.codes());
    if (codes.isEmpty()) {
      throw new BadRequestException("codes are required");
    }

    if (!markingLookupReady(settings)) {
      // Нет ключа ASL — локальный склад всё равно можно закрыть после продажи/фискала.
      List<MarkingWithdrawItemResult> local = codes.stream()
        .map(code -> MarkingWithdrawItemResult.ok(code, fiscalConfirmed ? "FISCAL_SUBMITTED" : "LOCAL_ONLY"))
        .toList();
      return summarize(local);
    }

    String baseUrl = normalizeBaseUrl(settings.getAslApiBaseUrl());
    String apiKey = settings.getAslApiKey();
    List<MarkingWithdrawItemResult> results = new ArrayList<>();
    for (String code : codes) {
      results.add(withdrawClient.confirm(baseUrl, apiKey, code, fiscalConfirmed));
    }
    return summarize(results);
  }

  private static MarkingWithdrawResponse summarize(List<MarkingWithdrawItemResult> results) {
    int ok = 0;
    int pending = 0;
    int failed = 0;
    for (MarkingWithdrawItemResult item : results) {
      if (item.success()) {
        ok++;
      } else if (item.pending()) {
        pending++;
      } else {
        failed++;
      }
    }
    return new MarkingWithdrawResponse(results, ok, pending, failed);
  }

  private static List<String> distinctCodes(List<String> codes) {
    LinkedHashSet<String> set = new LinkedHashSet<>();
    if (codes != null) {
      for (String code : codes) {
        if (StringUtils.hasText(code)) {
          set.add(code.trim());
        }
      }
    }
    return List.copyOf(set);
  }

  private boolean markingLookupReady(StorePharmacyIntegration settings) {
    return settings.isAslEnabled() || AslApiKeySupport.hasKey(settings.getAslApiKey());
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
}
