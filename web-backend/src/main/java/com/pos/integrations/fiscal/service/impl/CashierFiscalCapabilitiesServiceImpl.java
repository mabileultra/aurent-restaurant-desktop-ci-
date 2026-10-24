package com.pos.integrations.fiscal.service.impl;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.integrations.fiscal.domain.FiscalProvider;
import com.pos.integrations.fiscal.dto.CashierFiscalCapabilitiesResponse;
import com.pos.integrations.fiscal.service.CashierFiscalCapabilitiesService;
import com.pos.integrations.fiscaldrive.dto.FiscalDriveSettingsResponse;
import com.pos.integrations.fiscaldrive.service.FiscalDriveSettingsService;
import com.pos.integrations.fiscaldrive.support.FiscalDriveDefaults;
import com.pos.integrations.multikassa.dto.CashierMultikassaCapabilitiesResponse;
import com.pos.integrations.multikassa.service.MultikassaSettingsService;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.service.support.CashierSaleSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CashierFiscalCapabilitiesServiceImpl implements CashierFiscalCapabilitiesService {

    private final CashierSaleSupport cashierSaleSupport;
    private final CashRegisterRepository cashRegisterRepository;
    private final CashierShiftRepository cashierShiftRepository;
    private final MultikassaSettingsService multikassaSettingsService;
    private final FiscalDriveSettingsService fiscalDriveSettingsService;

    @Override
    @Transactional(readOnly = true)
    public CashierFiscalCapabilitiesResponse getCapabilities(User cashier, Integer storeId, Long cashRegisterId) {
        Store store = cashierSaleSupport.requireStoreForSale(cashier, storeId);
        CashRegister register = resolveRegister(cashier, store, cashRegisterId);
        if (register != null && register.getFiscalProvider() == FiscalProvider.FISCAL_DRIVE) {
            return toFiscalDrive(fiscalDriveSettingsService.getSettings(register.getId()));
        }
        return toMultikassa(multikassaSettingsService.getCashierCapabilities(cashier, storeId, cashRegisterId));
    }

    private CashRegister resolveRegister(User cashier, Store store, Long cashRegisterId) {
        if (cashRegisterId != null) {
            return cashRegisterRepository.findById(cashRegisterId).orElse(null);
        }
        CashRegister fromShift = cashierShiftRepository
            .findByCashierIdAndStoreIdAndStatus(cashier.getId(), store.getId(), CashierShift.ShiftStatus.OPEN)
            .map(CashierShift::getCashRegister)
            .orElse(null);
        if (fromShift != null) {
            return fromShift;
        }
        return cashRegisterRepository
            .findFirstByStore_IdAndStatusIgnoreCaseOrderByRegisterNumberAsc(store.getId(), "ACTIVE")
            .orElse(null);
    }

    private static CashierFiscalCapabilitiesResponse toFiscalDrive(FiscalDriveSettingsResponse fd) {
        return new CashierFiscalCapabilitiesResponse(
            true,
            fd.cashRegisterId(),
            FiscalProvider.FISCAL_DRIVE.name(),
            fd.baseUrl() != null ? fd.baseUrl() : FiscalDriveDefaults.DEFAULT_BASE_URL,
            fd.terminalId(),
            fd.factoryId(),
            null,
            true,
            true
        );
    }

    private static CashierFiscalCapabilitiesResponse toMultikassa(CashierMultikassaCapabilitiesResponse mk) {
        return new CashierFiscalCapabilitiesResponse(
            mk.enabled(),
            mk.cashRegisterId(),
            mk.fiscalProvider() != null ? mk.fiscalProvider() : FiscalProvider.MULTIKASSA.name(),
            mk.baseUrl(),
            mk.terminalId(),
            null,
            mk.moduleNumber(),
            mk.requireBeforeSale(),
            mk.printFiscalQr()
        );
    }
}
