package com.pos.pharmacy.marks.support;

public final class StockMarkMonitorSql {

    public static final String FILTER = """
        WHERE sm.company_id = :companyId
          AND (CAST(:storeId AS INTEGER) IS NULL OR sm.store_id = :storeId)
          AND (CAST(:status AS VARCHAR) IS NULL OR sm.status = CAST(:status AS VARCHAR))
          AND (CAST(:soldFrom AS TIMESTAMPTZ) IS NULL OR coalesce(sm.sold_at, sm.updated_at) >= :soldFrom)
          AND (CAST(:soldTo AS TIMESTAMPTZ) IS NULL OR coalesce(sm.sold_at, sm.updated_at) < :soldTo)
          AND (
            CAST(:search AS TEXT) IS NULL
            OR lower(sm.mark_code::text) LIKE lower('%' || CAST(:search AS TEXT) || '%')
            OR lower(sm.mark_key) LIKE lower('%' || CAST(:search AS TEXT) || '%')
          )
          AND (
            :problemsOnly = false
            OR sm.status = 'PENDING_WITHDRAW'
            OR (sm.last_withdraw_error IS NOT NULL AND length(btrim(sm.last_withdraw_error)) > 0)
          )
          AND (
            CAST(:shiftId AS UUID) IS NULL
            OR EXISTS (
              SELECT 1 FROM sales s
              WHERE s.id = sm.sale_id
                AND s.company_id = :companyId
                AND s.cashier_shift_id = :shiftId
            )
          )
        """;

    public static final String SELECT =
        "SELECT sm.* FROM stock_marks sm " + FILTER + " ORDER BY coalesce(sm.sold_at, sm.updated_at) DESC";

    public static final String COUNT =
        "SELECT count(*) FROM stock_marks sm " + FILTER;

    private StockMarkMonitorSql() {
    }
}
