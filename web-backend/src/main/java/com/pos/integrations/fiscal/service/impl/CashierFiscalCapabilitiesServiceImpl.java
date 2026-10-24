package com.pos.integrations.fiscal.service.impl;

import com.pos.entity.User;
import com.pos.integrations.fiscal.domain.FiscalProvider;
import com.pos.integrations.fiscal.dto.CashierFiscalCapabilitiesResponse;
import com.pos.integrations.fiscal.service.CashierFiscalCapabilitiesService;
import com.pos.integrations.multikassa.dto.CashierMultikassaCapabilitiesResponse;
import com.pos.integrations.multikassa.service.MultikassaSettingsService;
import com.pos.service.support.CashierSaleSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CashierFiscalCapabilitiesServiceImpl implements CashierFiscalCapabilitiesService {

    private final CashierSaleSupport cashierSaleSupport;
    private final MultikassaSettingsService multikassaSettingsService;

    @Override
    @Transactional(readOnly = true)
    public CashierFiscalCapabilitiesResponse getCapabilities(User cashier, Integer storeId, Long cashRegisterId) {
        cashierSaleSupport.requireStoreForSale(cashier, storeId);
        // FiscalDrive временно скрыт с кассы — всегда Multikassa.
        return toMultikassa(multikassaSettingsService.getCashierCapabilities(cashier, storeId, cashRegisterId));
    }

    private static CashierFiscalCapabilitiesResponse toMultikassa(CashierMultikassaCapabilitiesResponse mk) {
        return new CashierFiscalCapabilitiesResponse(
            mk.enabled(),
            mk.cashRegisterId(),
            FiscalProvider.MULTIKASSA.name(),
            mk.baseUrl(),
            mk.terminalId(),
            null,
            mk.moduleNumber(),
            mk.requireBeforeSale(),
            mk.printFiscalQr()
        );
    }
}
