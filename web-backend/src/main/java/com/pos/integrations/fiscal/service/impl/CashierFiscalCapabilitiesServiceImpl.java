package com.pos.integrations.fiscal.service.impl;

import com.pos.entity.User;
import com.pos.integrations.fiscal.domain.FiscalProvider;
import com.pos.integrations.fiscal.dto.CashierFiscalCapabilitiesResponse;
import com.pos.integrations.fiscal.service.CashierFiscalCapabilitiesService;
import com.pos.integrations.fiscaldrive.support.FiscalDriveDefaults;
import com.pos.service.support.CashierSaleSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lab-only: касса налоговой сборки фискализирует только через FiscalDrive.
 * Multikassa на этот контур не отдаётся. В прод эту версию не мержить.
 */
@Service
@RequiredArgsConstructor
public class CashierFiscalCapabilitiesServiceImpl implements CashierFiscalCapabilitiesService {

    private final CashierSaleSupport cashierSaleSupport;

    @Override
    @Transactional(readOnly = true)
    public CashierFiscalCapabilitiesResponse getCapabilities(User cashier, Integer storeId, Long cashRegisterId) {
        cashierSaleSupport.requireStoreForSale(cashier, storeId);
        return new CashierFiscalCapabilitiesResponse(
            true,
            cashRegisterId,
            FiscalProvider.FISCAL_DRIVE.name(),
            FiscalDriveDefaults.DEFAULT_BASE_URL,
            null,
            null,
            null,
            true,
            true
        );
    }
}
