package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsConnectedSql;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsRegionFilter;
import com.pos.taxanalytics.support.TaxAnalyticsWeekWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsReportQueryRepository {

    private final JdbcTemplate jdbc;

    public List<Map<String, Object>> daily(TaxAnalyticsPeriod period) {
        return jdbc.queryForList(
            """
                WITH days AS (
                  SELECT (s.created_at AT TIME ZONE 'Asia/Tashkent')::date AS day,
                         COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS fiscal_turnover,
                         COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS non_fiscal_turnover
                  FROM sales s
                  WHERE s.status = 'COMPLETED'
                    AND s.created_at >= ? AND s.created_at < ?
                  GROUP BY 1
                ),
                ranked AS (
                  SELECT (s.created_at AT TIME ZONE 'Asia/Tashkent')::date AS day,
                         c.id AS company_id,
                         c.name AS company_name,
                         SUM(s.total_amount) AS total,
                         ROW_NUMBER() OVER (
                           PARTITION BY (s.created_at AT TIME ZONE 'Asia/Tashkent')::date
                           ORDER BY SUM(s.total_amount) DESC, c.id
                         ) AS rn
                  FROM sales s
                  LEFT JOIN stores st ON st.id = s.store_id
                  JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
                  WHERE s.status = 'COMPLETED'
                    AND s.created_at >= ? AND s.created_at < ?
                  GROUP BY 1, c.id, c.name
                )
                SELECT d.day, d.fiscal_turnover, d.non_fiscal_turnover,
                       r.company_id AS leader_company_id, r.company_name AS leader_company_name
                FROM days d
                LEFT JOIN ranked r ON r.day = d.day AND r.rn = 1
                ORDER BY d.day
                """,
            ts(period.from()),
            ts(period.to().plusDays(1)),
            ts(period.from()),
            ts(period.to().plusDays(1))
        );
    }

    public long countReceipts(
        TaxAnalyticsPeriod period,
        String regionCode,
        String connectionStatus,
        String search
    ) {
        StringBuilder sql = receiptFrom();
        List<Object> args = receiptArgs(sql, period, regionCode, connectionStatus, search);
        Long n = jdbc.queryForObject(withConnected() + " SELECT COUNT(*) " + sql, Long.class, args.toArray());
        return n == null ? 0L : n;
    }

    public List<Map<String, Object>> receipts(
        TaxAnalyticsPeriod period,
        String regionCode,
        String connectionStatus,
        String search,
        int limit,
        int offset
    ) {
        StringBuilder sql = receiptFrom();
        List<Object> args = receiptArgs(sql, period, regionCode, connectionStatus, search);
        sql.insert(0, withConnected() + """
            SELECT s.id::text AS sale_id, s.receipt_number, s.created_at, st.name AS store_name,
                   s.total_amount, s.fiscal_status,
                   NULLIF(BTRIM(s.fiscal_qr_url), '') IS NOT NULL AS has_qr,
                   c.id AS company_id, c.name AS company_name
            """);
        sql.append(" ORDER BY s.created_at DESC LIMIT ? OFFSET ? ");
        args.add(limit);
        args.add(offset);
        return jdbc.queryForList(sql.toString(), args.toArray());
    }

    private static String withConnected() {
        return "WITH connected AS ( " + TaxAnalyticsConnectedSql.SQL + " ) ";
    }

    private static StringBuilder receiptFrom() {
        StringBuilder sql = new StringBuilder();
        sql.append("""
            FROM sales s
            LEFT JOIN stores st ON st.id = s.store_id
            JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
            LEFT JOIN connected conn ON conn.company_id = c.id
            WHERE s.status = 'COMPLETED'
              AND s.created_at >= ? AND s.created_at < ?
            """);
        return sql;
    }

    private static List<Object> receiptArgs(
        StringBuilder sql,
        TaxAnalyticsPeriod period,
        String regionCode,
        String connectionStatus,
        String search
    ) {
        List<Object> args = new ArrayList<>();
        args.add(ts(period.from()));
        args.add(ts(period.to().plusDays(1)));
        TaxAnalyticsRegionFilter.append(sql, args, regionCode);
        if ("CONNECTED".equalsIgnoreCase(connectionStatus)) {
            sql.append(" AND conn.company_id IS NOT NULL ");
        } else if ("NOT_CONNECTED".equalsIgnoreCase(connectionStatus)) {
            sql.append(" AND conn.company_id IS NULL ");
        }
        if (search != null && !search.isBlank()) {
            sql.append(" AND (LOWER(c.name) LIKE ? OR LOWER(COALESCE(c.tin, '')) LIKE ?) ");
            String query = "%" + search.trim().toLowerCase() + "%";
            args.add(query);
            args.add(query);
        }
        return args;
    }

    private static Timestamp ts(LocalDate day) {
        return Timestamp.from(day.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant());
    }
}
