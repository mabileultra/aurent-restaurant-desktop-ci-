package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsWeekWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsCompanyStatsRepository {

    private final JdbcTemplate jdbc;

    public Map<String, Object> periodReceiptStats(int companyId, TaxAnalyticsPeriod period) {
        String sql = """
            SELECT COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN 1 ELSE 0 END), 0) AS fiscal_receipt_count,
                   COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN 1 ELSE 0 END), 0) AS non_fiscal_receipt_count,
                   COALESCE(AVG(s.total_amount), 0) AS average_check
            FROM sales s
            LEFT JOIN stores st ON st.id = s.store_id
            WHERE s.status = 'COMPLETED'
              AND COALESCE(s.company_id, st.company_id) = ?
              AND s.created_at >= ? AND s.created_at < ?
            """;
        return jdbc.queryForMap(sql, companyId, ts(period.from()), ts(period.to().plusDays(1)));
    }

    public Map<String, Object> saleBounds(int companyId) {
        String sql = """
            SELECT MIN((s.created_at AT TIME ZONE 'Asia/Tashkent')::date) AS first_sale_date,
                   MAX((s.created_at AT TIME ZONE 'Asia/Tashkent')::date) AS last_sale_date
            FROM sales s
            LEFT JOIN stores st ON st.id = s.store_id
            WHERE s.status = 'COMPLETED'
              AND COALESCE(s.company_id, st.company_id) = ?
            """;
        return jdbc.queryForMap(sql, companyId);
    }

    public String latestFiscalTerminal(int companyId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            """
                SELECT s.fiscal_terminal_id
                FROM sales s
                LEFT JOIN stores st ON st.id = s.store_id
                WHERE s.status = 'COMPLETED'
                  AND COALESCE(s.company_id, st.company_id) = ?
                  AND NULLIF(BTRIM(s.fiscal_terminal_id), '') IS NOT NULL
                ORDER BY s.created_at DESC
                LIMIT 1
                """,
            companyId
        );
        if (rows.isEmpty() || rows.get(0).get("fiscal_terminal_id") == null) {
            return null;
        }
        return String.valueOf(rows.get(0).get("fiscal_terminal_id"));
    }

    private static Timestamp ts(LocalDate date) {
        Instant instant = date.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant();
        return Timestamp.from(instant);
    }
}
