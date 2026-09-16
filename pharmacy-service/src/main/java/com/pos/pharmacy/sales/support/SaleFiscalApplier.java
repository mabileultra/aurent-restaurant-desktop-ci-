package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.sales.dto.SaleFiscalPayload;
import com.pos.pharmacy.sales.entity.Sale;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Locale;

@Component
public class SaleFiscalApplier {

    public static final String STATUS_NOT_REQUIRED = "NOT_REQUIRED";
    public static final String STATUS_FISCALIZED = "FISCALIZED";
    public static final String STATUS_PENDING = "PENDING_FISCAL";

    public void apply(Sale sale, SaleFiscalPayload fiscal) {
        if (fiscal == null) {
            sale.setFiscalStatus(STATUS_NOT_REQUIRED);
            return;
        }
        String status = normalizeStatus(fiscal.fiscalStatus());
        sale.setFiscalStatus(status);
        sale.setFiscalSign(trimToNull(fiscal.fiscalSign()));
        sale.setFiscalReceiptSeq(trimToNull(fiscal.fiscalReceiptSeq()));
        sale.setMultikassaSaleId(trimToNull(fiscal.multikassaSaleId()));
        sale.setFiscalQrUrl(trimToNull(fiscal.fiscalQrUrl()));
        sale.setFiscalTerminalId(trimToNull(fiscal.fiscalTerminalId()));
        sale.setFiscalError(trimToNull(fiscal.fiscalError()));
        if (STATUS_FISCALIZED.equals(status)) {
            sale.setFiscalizedAt(Instant.now());
        }
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
