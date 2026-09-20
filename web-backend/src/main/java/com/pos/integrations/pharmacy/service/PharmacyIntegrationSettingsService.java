package com.pos.integrations.pharmacy.service;

import com.pos.integrations.pharmacy.dto.AdminPharmacyIntegrationResponse;
import com.pos.integrations.pharmacy.dto.CashierPharmacyIntegrationResponse;
import com.pos.integrations.pharmacy.dto.MarkingVerifyResponse;
import com.pos.integrations.pharmacy.dto.SavePharmacyIntegrationRequest;
import com.pos.entity.Store;
import com.pos.entity.User;

public interface PharmacyIntegrationSettingsService {

  AdminPharmacyIntegrationResponse getAdminSettings(Integer storeId);

  AdminPharmacyIntegrationResponse saveAdminSettings(Integer storeId, SavePharmacyIntegrationRequest request);

  CashierPharmacyIntegrationResponse getCashierCapabilities(User cashier, Integer storeId);

  MarkingVerifyResponse verifyMarking(User cashier, Integer storeId, String code);

  void assertPharmacyStore(Store store);

  void assertAslMarkingStore(Store store);
}
