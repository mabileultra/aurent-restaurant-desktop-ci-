package com.pos.integrations.fiscaldrive.service.impl;

import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.integrations.fiscal.domain.FiscalProvider;
import com.pos.integrations.fiscaldrive.dto.FiscalDriveSettingsResponse;
import com.pos.integrations.fiscaldrive.dto.SaveFiscalDriveSettingsRequest;
import com.pos.integrations.fiscaldrive.entity.CashRegisterFiscalDriveSettings;
import com.pos.integrations.fiscaldrive.repository.CashRegisterFiscalDriveSettingsRepository;
import com.pos.integrations.fiscaldrive.service.FiscalDriveSettingsService;
import com.pos.integrations.fiscaldrive.support.FiscalDriveDefaults;
import com.pos.integrations.multikassa.support.MultikassaCashierRegisterGuard;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import com.pos.util.DbExceptionTranslator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class FiscalDriveSettingsServiceImpl implements FiscalDriveSettingsService {

    private final CashRegisterRepository cashRegisterRepository;
    private final CashRegisterFiscalDriveSettingsRepository settingsRepository;
    private final TenantAccessSupport tenantAccess;
    private final MultikassaCashierRegisterGuard registerGuard;

    @Override
    @Transactional(readOnly = true)
    public FiscalDriveSettingsResponse getSettings(Long cashRegisterId) {
        CashRegister register = requireAccessibleRegister(cashRegisterId);
        return toResponse(register, settingsRepository.findById(cashRegisterId).orElse(null));
    }

    @Override
    @Transactional
    public FiscalDriveSettingsResponse saveSettings(Long cashRegisterId, SaveFiscalDriveSettingsRequest request) {
        CashRegister register = requireAccessibleRegister(cashRegisterId);
        CashRegisterFiscalDriveSettings entity = settingsRepository.findById(cashRegisterId)
            .orElseGet(() -> CashRegisterFiscalDriveSettings.builder().cashRegister(register).build());

        String factoryId = trimToNull(request.factoryId());
        entity.setBaseUrl(normalizeBaseUrl(request.baseUrl()));
        entity.setFactoryId(factoryId);
        entity.setTerminalId(upperTrimToNull(request.terminalId()));
        entity.setOwnerTin(trimToNull(request.ownerTin()));
        entity.setUpdatedAt(Instant.now());

        if (Boolean.TRUE.equals(request.useForFiscalization())) {
            if (factoryId == null) {
                throw new BadRequestException("Для FiscalDrive укажите FactoryID модуля");
            }
            register.setFiscalProvider(FiscalProvider.FISCAL_DRIVE);
        } else if (Boolean.FALSE.equals(request.useForFiscalization())
            && register.getFiscalProvider() == FiscalProvider.FISCAL_DRIVE) {
            register.setFiscalProvider(FiscalProvider.MULTIKASSA);
        }

        DbExceptionTranslator.persist(() -> {
            settingsRepository.save(entity);
            return cashRegisterRepository.save(register);
        });
        LogUtil.info(
            FiscalDriveSettingsServiceImpl.class,
            "FiscalDrive settings saved: registerId={}, baseUrl={}, factoryId={}, provider={}",
            cashRegisterId,
            entity.getBaseUrl(),
            entity.getFactoryId(),
            register.getFiscalProvider()
        );
        return toResponse(register, entity);
    }

    private CashRegister requireAccessibleRegister(Long cashRegisterId) {
        CashRegister register = cashRegisterRepository.findById(cashRegisterId)
            .orElseThrow(() -> new ResourceNotFoundException("Cash register not found"));
        tenantAccess.assertCanAccessStore(register.getStore());
        registerGuard.assertCashierMayConfigureRegister(tenantAccess.currentUser(), register);
        return register;
    }

    private static FiscalDriveSettingsResponse toResponse(
        CashRegister register,
        CashRegisterFiscalDriveSettings entity
    ) {
        FiscalProvider provider = register.getFiscalProvider() != null
            ? register.getFiscalProvider()
            : FiscalProvider.MULTIKASSA;
        return new FiscalDriveSettingsResponse(
            register.getId(),
            entity != null ? normalizeBaseUrl(entity.getBaseUrl()) : FiscalDriveDefaults.DEFAULT_BASE_URL,
            entity != null ? entity.getFactoryId() : null,
            entity != null ? entity.getTerminalId() : null,
            entity != null ? entity.getOwnerTin() : null,
            FiscalDriveDefaults.DEFAULT_BASE_URL,
            provider.name(),
            provider == FiscalProvider.FISCAL_DRIVE
        );
    }

    private static String normalizeBaseUrl(String baseUrl) {
        if (!StringUtils.hasText(baseUrl)) {
            return FiscalDriveDefaults.DEFAULT_BASE_URL;
        }
        String trimmed = baseUrl.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static String upperTrimToNull(String value) {
        String trimmed = trimToNull(value);
        return trimmed != null ? trimmed.toUpperCase() : null;
    }
}
