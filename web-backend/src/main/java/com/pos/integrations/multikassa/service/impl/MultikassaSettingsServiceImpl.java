package com.pos.integrations.multikassa.service.impl;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.integrations.multikassa.dto.AdminMultikassaSettingsResponse;
import com.pos.integrations.multikassa.dto.CashierMultikassaCapabilitiesResponse;
import com.pos.integrations.multikassa.dto.SaveMultikassaSettingsRequest;
import com.pos.integrations.multikassa.dto.UpdateCashierMultikassaFlagsRequest;
import com.pos.integrations.multikassa.entity.CashRegisterMultikassaSettings;
import com.pos.integrations.multikassa.repository.CashRegisterMultikassaSettingsRepository;
import com.pos.integrations.multikassa.service.MultikassaSettingsService;
import com.pos.integrations.multikassa.support.MultikassaCashierRegisterGuard;
import com.pos.integrations.multikassa.support.MultikassaDefaults;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import com.pos.util.DbExceptionTranslator;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MultikassaSettingsServiceImpl implements MultikassaSettingsService {

    private final CashRegisterRepository cashRegisterRepository;
    private final CashRegisterMultikassaSettingsRepository settingsRepository;
    private final CashierShiftRepository cashierShiftRepository;
    private final TenantAccessSupport tenantAccess;
    private final CashierSaleSupport cashierSaleSupport;
    private final MultikassaCashierRegisterGuard cashierRegisterGuard;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public AdminMultikassaSettingsResponse getAdminSettings(Long cashRegisterId) {
        CashRegister register = requireRegister(cashRegisterId);
        tenantAccess.assertCanAccessStore(register.getStore());
        cashierRegisterGuard.assertCashierMayConfigureRegister(tenantAccess.currentUser(), register);
        return toAdminResponse(register, findOrDefault(register));
    }

    @Override
    @Transactional
    public AdminMultikassaSettingsResponse saveAdminSettings(
        Long cashRegisterId,
        SaveMultikassaSettingsRequest request
    ) {
        CashRegister register = requireRegister(cashRegisterId);
        tenantAccess.assertCanAccessStore(register.getStore());
        cashierRegisterGuard.assertCashierMayConfigureRegister(tenantAccess.currentUser(), register);

        CashRegisterMultikassaSettings entity = settingsRepository.findById(cashRegisterId)
            .orElseGet(() -> newSettingsRow(register));

        entity.setEnabled(request.enabled());
        entity.setBaseUrl(normalizeBaseUrl(request.baseUrl()));
        entity.setTerminalId(trimToNull(request.terminalId()));
        entity.setModuleNumber(trimToNull(request.moduleNumber()));
        entity.setSelectedDriveId(trimToNull(request.selectedDriveId()));
        entity.setCashierNameOverride(trimToNull(request.cashierNameOverride()));
        entity.setRequireBeforeSale(request.requireBeforeSale());
        entity.setPrintFiscalQr(request.printFiscalQr() == null || Boolean.TRUE.equals(request.printFiscalQr()));
        entity.setUpdatedAt(Instant.now());

        DbExceptionTranslator.persist(() -> settingsRepository.save(entity));
        LogUtil.info(
            MultikassaSettingsServiceImpl.class,
            "Multikassa settings saved: registerId={}, enabled={}, baseUrl={}",
            cashRegisterId,
            entity.isEnabled(),
            entity.getBaseUrl()
        );
        return toAdminResponse(register, entity);
    }

  @Override
  @Transactional(readOnly = true)
  public CashierMultikassaCapabilitiesResponse getCashierCapabilities(
      User cashier,
      Integer storeId,
      Long cashRegisterId
  ) {
      Store store = cashierSaleSupport.requireStoreForSale(cashier, storeId);
      CashRegister register = resolveRegisterForCashier(cashier, store, cashRegisterId);
      if (register == null) {
          return disabledCapabilities(null);
      }
      CashRegisterMultikassaSettings settings = findOrDefault(register);
      if (!settings.isEnabled()) {
          return disabledCapabilities(register.getId(), settings.isPrintFiscalQr());
      }
      return toCashierCapabilities(register, settings);
  }

  @Override
  @Transactional
  public CashierMultikassaCapabilitiesResponse updateCashierFlags(
      User cashier,
      Integer storeId,
      Long cashRegisterId,
      UpdateCashierMultikassaFlagsRequest request
  ) {
      if (request == null || (request.printFiscalQr() == null && request.requireBeforeSale() == null)) {
          throw new BadRequestException("Укажите printFiscalQr и/или requireBeforeSale");
      }
      Store store = cashierSaleSupport.requireStoreForSale(cashier, storeId);
      CashRegister register = resolveRegisterForCashier(cashier, store, cashRegisterId);
      if (register == null) {
          throw new BadRequestException("Нет открытой смены / кассы для настроек Multikassa");
      }

      ensurePrintFiscalQrColumnIfNeeded();
      try {
          return persistCashierFlags(register, request);
      } catch (RuntimeException ex) {
          throw translateDb(ex);
      }
  }

    private CashierMultikassaCapabilitiesResponse persistCashierFlags(
        CashRegister register,
        UpdateCashierMultikassaFlagsRequest request
    ) {
        settingsRepository.upsertFlags(
            register.getId(),
            MultikassaDefaults.DEFAULT_BASE_URL,
            request.printFiscalQr(),
            request.requireBeforeSale()
        );
        entityManager.clear();
        CashRegisterMultikassaSettings entity = settingsRepository.findById(register.getId())
            .orElseThrow(() -> new BadRequestException("Не удалось сохранить флаги Multikassa"));
        if (!entity.isEnabled()) {
            return disabledCapabilities(register.getId(), entity.isPrintFiscalQr());
        }
        return toCashierCapabilities(register, entity);
    }

    /** До INSERT/UPDATE — иначе после SQL-ошибки PostgreSQL abort'ит всю транзакцию. */
    private void ensurePrintFiscalQrColumnIfNeeded() {
        Number settingsCol = (Number) entityManager.createNativeQuery(
            "SELECT COUNT(*) FROM information_schema.columns "
                + "WHERE table_schema = current_schema() "
                + "AND table_name = 'cash_register_multikassa_settings' "
                + "AND column_name = 'print_fiscal_qr'"
        ).getSingleResult();
        if (settingsCol.longValue() == 0) {
            LogUtil.info(
                MultikassaSettingsServiceImpl.class,
                "Adding missing column cash_register_multikassa_settings.print_fiscal_qr"
            );
            entityManager.createNativeQuery(
                "ALTER TABLE cash_register_multikassa_settings "
                    + "ADD COLUMN print_fiscal_qr BOOLEAN NOT NULL DEFAULT TRUE"
            ).executeUpdate();
        }
        Number salesCol = (Number) entityManager.createNativeQuery(
            "SELECT COUNT(*) FROM information_schema.columns "
                + "WHERE table_schema = current_schema() "
                + "AND table_name = 'sales' "
                + "AND column_name = 'print_fiscal_qr'"
        ).getSingleResult();
        if (salesCol.longValue() == 0) {
            entityManager.createNativeQuery(
                "ALTER TABLE sales ADD COLUMN print_fiscal_qr BOOLEAN NOT NULL DEFAULT TRUE"
            ).executeUpdate();
        }
    }

    private static RuntimeException translateDb(Throwable ex) {
        return DbExceptionTranslator.toClientException(ex);
    }

    private CashRegisterMultikassaSettings newSettingsRow(CashRegister register) {
        CashRegisterMultikassaSettings entity = new CashRegisterMultikassaSettings();
        entity.setCashRegister(register);
        entity.setEnabled(false);
        entity.setBaseUrl(MultikassaDefaults.DEFAULT_BASE_URL);
        entity.setRequireBeforeSale(false);
        entity.setPrintFiscalQr(true);
        entity.setUpdatedAt(Instant.now());
        return entity;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CashRegisterMultikassaSettings> findEnabledByCashRegisterId(Long cashRegisterId) {
        if (cashRegisterId == null) {
            return Optional.empty();
        }
        return settingsRepository.findById(cashRegisterId).filter(CashRegisterMultikassaSettings::isEnabled);
    }

    private CashRegister requireRegister(Long cashRegisterId) {
        return cashRegisterRepository.findById(cashRegisterId)
            .orElseThrow(() -> new ResourceNotFoundException("Cash register not found"));
    }

    private CashRegister resolveRegister(Integer storeId, Long cashRegisterId) {
        if (cashRegisterId != null) {
            CashRegister register = requireRegister(cashRegisterId);
            if (storeId != null && register.getStore() != null
                && !storeId.equals(register.getStore().getId())) {
                throw new BadRequestException("Cash register does not belong to store");
            }
            return register;
        }
        return null;
    }

    private CashRegister resolveRegisterForCashier(User cashier, Store store, Long cashRegisterId) {
        CashRegister register = resolveRegister(store.getId(), cashRegisterId);
        if (register == null) {
            register = cashierShiftRepository
                .findByCashierIdAndStoreIdAndStatus(cashier.getId(), store.getId(), CashierShift.ShiftStatus.OPEN)
                .map(CashierShift::getCashRegister)
                .orElse(null);
        }
        // Pharmacy shifts live in pharmacy-service and do not populate grocery CashierShift —
        // fall back to the store's first active register so Multikassa settings/fiscal still work.
        if (register == null && store.getId() != null) {
            register = cashRegisterRepository
                .findFirstByStore_IdAndStatusIgnoreCaseOrderByRegisterNumberAsc(store.getId(), "ACTIVE")
                .orElse(null);
        }
        return register;
    }

    private CashierMultikassaCapabilitiesResponse toCashierCapabilities(
        CashRegister register,
        CashRegisterMultikassaSettings settings
    ) {
        return new CashierMultikassaCapabilitiesResponse(
            true,
            register.getId(),
            normalizeBaseUrl(settings.getBaseUrl()),
            settings.getTerminalId(),
            settings.getModuleNumber(),
            settings.getSelectedDriveId(),
            settings.getCashierNameOverride(),
            settings.isRequireBeforeSale(),
            settings.isPrintFiscalQr()
        );
    }

    private CashRegisterMultikassaSettings findOrDefault(CashRegister register) {
        return settingsRepository.findById(register.getId())
            .orElseGet(() -> newSettingsRow(register));
    }

    private AdminMultikassaSettingsResponse toAdminResponse(
        CashRegister register,
        CashRegisterMultikassaSettings entity
    ) {
        return new AdminMultikassaSettingsResponse(
            register.getId(),
            register.getStore() != null ? register.getStore().getId() : null,
            register.getRegisterNumber(),
            entity.isEnabled(),
            normalizeBaseUrl(entity.getBaseUrl()),
            entity.getTerminalId(),
            entity.getModuleNumber(),
            entity.getSelectedDriveId(),
            entity.getCashierNameOverride(),
            entity.isRequireBeforeSale(),
            entity.isPrintFiscalQr(),
            MultikassaDefaults.LOCAL_BASE_URL_8080,
            MultikassaDefaults.LOCAL_BASE_URL_12346,
            MultikassaDefaults.CLOUD_V3_BASE_URL,
            MultikassaDefaults.CLOUD_V4_BASE_URL
        );
    }

    private CashierMultikassaCapabilitiesResponse disabledCapabilities(Long cashRegisterId) {
        return disabledCapabilities(cashRegisterId, true);
    }

    private CashierMultikassaCapabilitiesResponse disabledCapabilities(Long cashRegisterId, boolean printFiscalQr) {
        return new CashierMultikassaCapabilitiesResponse(
            false,
            cashRegisterId,
            MultikassaDefaults.DEFAULT_BASE_URL,
            null,
            null,
            null,
            null,
            false,
            printFiscalQr
        );
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (!StringUtils.hasText(baseUrl)) {
            return MultikassaDefaults.DEFAULT_BASE_URL;
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
}
