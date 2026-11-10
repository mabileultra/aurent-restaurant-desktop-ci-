package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsConnectedSql;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsWeekWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Companies in a region with NULL district_code. */
@Repository
@RequiredArgsConstructor
public class TaxAnalyticsUnassignedDistrictRepository {

    private final JdbcTemplate jdbc;

    public Map<String, Object> totals(
        TaxAnalyticsPeriod period,
        String regionCode,
        String connectionStatus,
        String businessType
    ) {
        StringBuilder sql = new StringBuilder();
        sql.append("WITH connected AS ( ").append(TaxAnalyticsConnectedSql.SQL).append(" ), ");
        sql.append("""
            missing AS (
              SELECT c.id,
                     CASE WHEN conn.company_id IS NOT NULL THEN 1 ELSE 0 END AS is_connected
              FROM companies c
              LEFT JOIN connected conn ON conn.company_id = c.id
              WHERE c.region_code = ?
                AND c.district_code IS NULL
            """);
        List<Object> args = new ArrayList<>();
        args.add(regionCode);
        appendConnection(sql, connectionStatus);
        appendBusinessType(sql, args, businessType);
        sql.append("""
            ),
            turnover AS (
              SELECT
                COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS fiscal_turnover,
                COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS non_fiscal_turnover
              FROM sales s
              LEFT JOIN stores st ON st.id = s.store_id
              JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
              LEFT JOIN connected conn ON conn.company_id = c.id
              WHERE s.status = 'COMPLETED'
                AND c.region_code = ?
                AND c.district_code IS NULL
                AND s.created_at >= ? AND s.created_at < ?
            """);
        args.add(regionCode);
        args.add(ts(period.from()));
        args.add(ts(period.to().plusDays(1)));
        appendConnection(sql, connectionStatus);
        appendBusinessType(sql, args, businessType);
        sql.append("""
            ),
            prev_turnover AS (
              SELECT COALESCE(SUM(s.total_amount), 0) AS total_turnover
              FROM sales s
              LEFT JOIN stores st ON st.id = s.store_id
              JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
              LEFT JOIN connected conn ON conn.company_id = c.id
              WHERE s.status = 'COMPLETED'
                AND c.region_code = ?
                AND c.district_code IS NULL
                AND s.created_at >= ? AND s.created_at < ?
            """);
        args.add(regionCode);
        args.add(ts(period.prevFrom()));
        args.add(ts(period.prevTo().plusDays(1)));
        appendConnection(sql, connectionStatus);
        appendBusinessType(sql, args, businessType);
        sql.append("""
            )
            SELECT
              COALESCE((SELECT COUNT(*) FROM missing), 0) AS enterprises,
              COALESCE((SELECT SUM(is_connected) FROM missing), 0) AS connected,
              COALESCE((SELECT fiscal_turnover FROM turnover), 0) AS fiscal_turnover,
              COALESCE((SELECT non_fiscal_turnover FROM turnover), 0) AS non_fiscal_turnover,
              COALESCE((SELECT total_turnover FROM prev_turnover), 0) AS prev_turnover
            """);
        return jdbc.queryForMap(sql.toString(), args.toArray());
    }

    public static boolean hasSignal(Map<String, Object> row) {
        if (row == null) {
            return false;
        }
        Object enterprises = row.get("enterprises");
        return enterprises instanceof Number number && number.longValue() > 0;
    }

    private static void appendConnection(StringBuilder sql, String connectionStatus) {
        if ("CONNECTED".equalsIgnoreCase(connectionStatus)) {
            sql.append(" AND conn.company_id IS NOT NULL ");
        } else if ("NOT_CONNECTED".equalsIgnoreCase(connectionStatus)) {
            sql.append(" AND conn.company_id IS NULL ");
        }
    }

    private static void appendBusinessType(StringBuilder sql, List<Object> args, String businessType) {
        if (businessType == null || businessType.isBlank()) {
            return;
        }
        sql.append(" AND UPPER(c.business_type) = ? ");
        args.add(businessType.trim().toUpperCase());
    }

    private static Timestamp ts(LocalDate date) {
        return Timestamp.from(date.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant());
    }
}
