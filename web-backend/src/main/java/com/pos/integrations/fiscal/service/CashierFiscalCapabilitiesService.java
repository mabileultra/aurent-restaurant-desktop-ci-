package com.pos.integrations.fiscal.service;

import com.pos.entity.User;
import com.pos.integrations.fiscal.dto.CashierFiscalCapabilitiesResponse;

public interface CashierFiscalCapabilitiesService {

    CashierFiscalCapabilitiesResponse getCapabilities(User cashier, Integer storeId, Long cashRegisterId);
}
