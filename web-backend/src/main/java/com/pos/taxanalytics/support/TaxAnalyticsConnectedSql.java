package com.pos.taxanalytics.support;

/** Connected = Multikassa enabled on any register of the company. */
public final class TaxAnalyticsConnectedSql {

    public static final String SQL = """
        SELECT DISTINCT s.company_id
        FROM stores s
        JOIN cash_registers cr ON cr.store_id = s.id
        JOIN cash_register_multikassa_settings mk
            ON mk.cash_register_id = cr.id AND mk.enabled = TRUE
        WHERE s.company_id IS NOT NULL
        """;

    private TaxAnalyticsConnectedSql() {
    }
}
