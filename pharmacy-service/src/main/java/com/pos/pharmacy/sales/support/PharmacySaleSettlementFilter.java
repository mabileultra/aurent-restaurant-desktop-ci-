package com.pos.pharmacy.sales.support;

import org.springframework.util.StringUtils;

/**
 * Maps ledger UI {@code paymentSettlement} (FULL / ADVANCE / CREDIT) to a filter token.
 * Same contract as grocery sales ledger.
 */
public final class PharmacySaleSettlementFilter {

    private PharmacySaleSettlementFilter() {
    }

    /** {@code null} = no filter (ALL / blank / unknown). */
    public static String normalize(String paymentSettlement) {
        if (!StringUtils.hasText(paymentSettlement)) {
            return null;
        }
        String value = paymentSettlement.trim().toUpperCase();
        if ("ALL".equals(value)) {
            return null;
        }
        if ("FULL".equals(value) || "ADVANCE".equals(value) || "CREDIT".equals(value)) {
            return value;
        }
        return null;
    }
}
