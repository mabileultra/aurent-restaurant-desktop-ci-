package com.pos.taxanalytics.support;

/**
 * Connected = Multikassa enabled, or FiscalDrive settings on a register
 * whose {@code fiscal_provider = FISCAL_DRIVE}.
 */
public final class TaxAnalyticsConnectedSql {

    public static final String SQL = """
        SELECT DISTINCT s.company_id
        FROM stores s
        JOIN cash_registers cr ON cr.store_id = s.id
        LEFT JOIN cash_register_multikassa_settings mk
            ON mk.cash_register_id = cr.id AND mk.enabled = TRUE
        LEFT JOIN cash_register_fiscal_drive_settings fd
            ON fd.cash_register_id = cr.id
        WHERE s.company_id IS NOT NULL
          AND (
            mk.cash_register_id IS NOT NULL
            OR (fd.cash_register_id IS NOT NULL AND cr.fiscal_provider = 'FISCAL_DRIVE')
          )
        """;

    private TaxAnalyticsConnectedSql() {
    }
}
