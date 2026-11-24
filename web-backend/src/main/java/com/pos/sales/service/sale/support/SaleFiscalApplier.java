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
    private final SaleFiscalQrPolicy qrPolicy;

    public void apply(Sale sale, CashierShift shift, SaleFiscalPayload fiscal) {
        apply(sale, shift, fiscal, true);
    }

    /**
     * @param enforceRequired если false — разрешаем PENDING_FISCAL (offline sync).
     *                        если true — жёстко требуем фискал только когда requireBeforeSale=true.
     */
    public void apply(Sale sale, CashierShift shift, SaleFiscalPayload fiscal, boolean enforceRequired) {
        Optional<CashRegisterMultikassaSettings> enabled = resolveEnabledSettings(shift);
        if (enabled.isEmpty()) {
            if (fiscal == null) {
                sale.setFiscalStatus(STATUS_NOT_REQUIRED);
                return;
            }
            // Не Multikassa (напр. FiscalDrive) — пишем payload как пришёл.
            writeFiscalFields(sale, fiscal, false);
            return;
        }

        CashRegisterMultikassaSettings settings = enabled.get();
        // Cashier «Fiskal QR» off = skip OFD entirely (no Multikassa/Labels). SoT: settings + sale flag.
        // AUR-21: у аванса и кредита QR скрыт по правилу налоговой, но чек фискализируется — это не «ОФД выключен».
        boolean saleQrOff = !sale.isPrintFiscalQr() && !qrPolicy.isQrSuppressed(sale.getReceiptType());
        boolean ofdOff = !settings.isPrintFiscalQr() || saleQrOff;
        boolean requireFiscal = enforceRequired && settings.isRequireBeforeSale() && !ofdOff;
        if (requireFiscal) {
            requireFiscalizedPayload(fiscal);
        }

        if (fiscal == null) {
            sale.setFiscalStatus(ofdOff ? STATUS_NOT_REQUIRED : STATUS_PENDING);
            return;
        }

        String status = normalizeStatus(fiscal.fiscalStatus());
        if (requireFiscal && !STATUS_FISCALIZED.equals(status)) {
            throw PosExceptions.badRequest("Требуется успешная фискализация Multikassa перед продажей");
        }

        writeFiscalFields(sale, fiscal, true);
    }

    /**
     * @param multikassaRegister касса с включённым Multikassa — FISCALIZED без sale id недопустим.
     */
    private void writeFiscalFields(Sale sale, SaleFiscalPayload fiscal, boolean multikassaRegister) {
        String status = normalizeStatus(fiscal.fiscalStatus());
        String saleId = trimToNull(fiscal.multikassaSaleId());
        // Multikassa refund (op4) needs receipt_sale_id. Sign/QR alone → PENDING, not FISCALIZED.
        if (multikassaRegister && STATUS_FISCALIZED.equals(status) && saleId == null) {
            sale.setFiscalStatus(STATUS_PENDING);
            sale.setFiscalSign(null);
            sale.setFiscalReceiptSeq(null);
            sale.setMultikassaSaleId(null);
            sale.setFiscalQrUrl(null);
            sale.setFiscalTerminalId(trimToNull(fiscal.fiscalTerminalId()));
            sale.setFiscalError(trimToNull(
                StringUtils.hasText(fiscal.fiscalError())
                    ? fiscal.fiscalError()
                    : "Нет Multikassa ID чека (нужен для возврата в Soliq)"
            ));
            sale.setFiscalizedAt(null);
            return;
        }
        sale.setFiscalStatus(status);
        sale.setFiscalSign(trimToNull(fiscal.fiscalSign()));
        sale.setFiscalReceiptSeq(trimToNull(fiscal.fiscalReceiptSeq()));
        sale.setMultikassaSaleId(saleId);
        sale.setFiscalQrUrl(trimToNull(fiscal.fiscalQrUrl()));
        sale.setFiscalTerminalId(trimToNull(fiscal.fiscalTerminalId()));
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
        if (!StringUtils.hasText(fiscal.multikassaSaleId())) {
            throw PosExceptions.badRequest("Нет ID чека Multikassa (нужен для возврата в Soliq)");
        }
        if (!StringUtils.hasText(fiscal.fiscalSign()) && !StringUtils.hasText(fiscal.fiscalQrUrl())) {
            throw PosExceptions.badRequest("Нет фискального признака / QR Multikassa");
        }
        if (isSyntheticFiscalSign(fiscal.fiscalSign())) {
            throw PosExceptions.badRequest("Поддельный фискальный признак (MK-*) не принимается");
        }
        // QR желателен, но без него не рвём продажу — иначе касса не печатает чек при сбое сборки QR.
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
