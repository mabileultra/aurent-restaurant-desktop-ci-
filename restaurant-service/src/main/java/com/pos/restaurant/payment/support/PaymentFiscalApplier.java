package com.pos.restaurant.payment.support;

import com.pos.restaurant.payment.dto.PaymentFiscalPayload;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Locale;

/**
 * Writes Multikassa proof onto a payment — never stores QR URL.
 */
@Component
public class PaymentFiscalApplier {

    public static final String STATUS_FISCALIZED = "FISCALIZED";

    public void apply(FloorOrderPayment payment, PaymentFiscalPayload fiscal) {
        if (payment == null || fiscal == null) {
            return;
        }
        String status = normalizeStatus(fiscal.fiscalStatus());
        payment.setFiscalStatus(status);
        payment.setFiscalSign(trimToNull(fiscal.fiscalSign()));
        payment.setFiscalReceiptSeq(trimToNull(fiscal.fiscalReceiptSeq()));
        payment.setMultikassaSaleId(trimToNull(fiscal.multikassaSaleId()));
        payment.setFiscalTerminalId(trimToNull(fiscal.fiscalTerminalId()));
        if (STATUS_FISCALIZED.equals(status) && payment.getFiscalizedAt() == null) {
            payment.setFiscalizedAt(Instant.now());
        }
    }

    private static String normalizeStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "PENDING";
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
