package com.pos.integrations.multikassa.service;

import com.pos.entity.User;
import com.pos.integrations.multikassa.dto.AdminMultikassaSettingsResponse;
import com.pos.integrations.multikassa.dto.CashierMultikassaCapabilitiesResponse;
import com.pos.integrations.multikassa.dto.SaveMultikassaSettingsRequest;
import com.pos.integrations.multikassa.entity.CashRegisterMultikassaSettings;

import java.util.Optional;

public interface MultikassaSettingsService {

    AdminMultikassaSettingsResponse getAdminSettings(Long cashRegisterId);

    AdminMultikassaSettingsResponse saveAdminSettings(Long cashRegisterId, SaveMultikassaSettingsRequest request);

    CashierMultikassaCapabilitiesResponse getCashierCapabilities(User cashier, Integer storeId, Long cashRegisterId);

    Optional<CashRegisterMultikassaSettings> findEnabledByCashRegisterId(Long cashRegisterId);
}
