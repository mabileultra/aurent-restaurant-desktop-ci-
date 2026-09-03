package com.pos.sales.service.sale.support;

import com.pos.exception.PosExceptions;
import com.pos.integrations.multikassa.entity.CashRegisterMultikassaSettings;
import com.pos.integrations.multikassa.service.MultikassaSettingsService;
import com.pos.sales.dto.sale.SaleFiscalPayload;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.entity.Sale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SaleFiscalApplier {

    public static final String STATUS_NOT_REQUIRED = "NOT_REQUIRED";
    public static final String STATUS_FISCALIZED = "FISCALIZED";
    public static final String STATUS_PENDING = "PENDING_FISCAL";
    public static final String STATUS_FAILED = "FISCAL_FAILED";

    private final MultikassaSettingsService multikassaSettingsService;

    public void apply(Sale sale, CashierShift shift, SaleFiscalPayload fiscal) {
        apply(sale, shift, fiscal, true);
    }

    /**
     * @param enforceRequired если false — разрешаем PENDING_FISCAL (offline sync).
     */
    public void apply(Sale sale, CashierShift shift, SaleFiscalPayload fiscal, boolean enforceRequired) {
        Optional<CashRegisterMultikassaSettings> enabled = resolveEnabledSettings(shift);
        if (enabled.isEmpty()) {
            if (fiscal == null) {
                sale.setFiscalStatus(STATUS_NOT_REQUIRED);
                return;
            }
            // Даже без настроек на кассе сохраняем пришедший fiscal с offline-клиента.
            writeFiscalFields(sale, fiscal);
            return;
        }

        CashRegisterMultikassaSettings settings = enabled.get();
        if (enforceRequired && settings.isRequireBeforeSale()) {
            requireFiscalizedPayload(fiscal);
        }

        if (fiscal == null) {
            sale.setFiscalStatus(STATUS_PENDING);
            return;
        }

        String status = normalizeStatus(fiscal.fiscalStatus());
        if (enforceRequired && settings.isRequireBeforeSale() && !STATUS_FISCALIZED.equals(status)) {
            throw PosExceptions.badRequest("Требуется успешная фискализация Multikassa перед продажей");
        }

        writeFiscalFields(sale, fiscal);
    }

    private void writeFiscalFields(Sale sale, SaleFiscalPayload fiscal) {
        String status = normalizeStatus(fiscal.fiscalStatus());
        sale.setFiscalStatus(status);
        sale.setFiscalSign(trimToNull(fiscal.fiscalSign()));
        sale.setFiscalReceiptSeq(trimToNull(fiscal.fiscalReceiptSeq()));
        sale.setMultikassaSaleId(trimToNull(fiscal.multikassaSaleId()));
        sale.setFiscalQrUrl(trimToNull(fiscal.fiscalQrUrl()));
        sale.setFiscalError(trimToNull(fiscal.fiscalError()));
        if (STATUS_FISCALIZED.equals(status)) {
            sale.setFiscalizedAt(Instant.now());
        }
    }

    private Optional<CashRegisterMultikassaSettings> resolveEnabledSettings(CashierShift shift) {
        if (shift == null || shift.getCashRegister() == null) {
            return Optional.empty();
        }
        return multikassaSettingsService.findEnabledByCashRegisterId(shift.getCashRegister().getId());
    }

    private static void requireFiscalizedPayload(SaleFiscalPayload fiscal) {
        if (fiscal == null) {
            throw PosExceptions.badRequest("Требуется фискализация Multikassa перед продажей");
        }
        String status = normalizeStatus(fiscal.fiscalStatus());
        if (!STATUS_FISCALIZED.equals(status)) {
            throw PosExceptions.badRequest("Требуется успешная фискализация Multikassa перед продажей");
        }
        if (!StringUtils.hasText(fiscal.fiscalSign()) && !StringUtils.hasText(fiscal.multikassaSaleId())) {
            throw PosExceptions.badRequest("Нет фискального признака / ID чека Multikassa");
        }
        if (isSyntheticFiscalSign(fiscal.fiscalSign())) {
            throw PosExceptions.badRequest("Поддельный фискальный признак (MK-*) не принимается");
        }
    }

    private static boolean isSyntheticFiscalSign(String sign) {
        if (!StringUtils.hasText(sign)) {
            return false;
        }
        String s = sign.trim();
        return s.regionMatches(true, 0, "MK-", 0, 3) || s.regionMatches(true, 0, "LOCAL-", 0, 6);
    }

    private static String normalizeStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            return STATUS_PENDING;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
