package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsConnectedSql;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsWeekWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsCompanyQueryRepository {

    private final JdbcTemplate jdbc;

    public long countCompanies(
        String regionCode,
        String districtCode,
        String connectionStatus,
        String search
    ) {
        StringBuilder sql = new StringBuilder();
        sql.append("WITH connected AS ( ").append(TaxAnalyticsConnectedSql.SQL).append(" ) ");
        sql.append("""
            SELECT COUNT(*)
            FROM companies c
            LEFT JOIN connected conn ON conn.company_id = c.id
            WHERE 1=1
            """);
        List<Object> args = new ArrayList<>();
        appendFilters(sql, args, regionCode, districtCode, connectionStatus, search);
        Long count = args.isEmpty()
            ? jdbc.queryForObject(sql.toString(), Long.class)
            : jdbc.queryForObject(sql.toString(), Long.class, args.toArray());
        return count == null ? 0L : count;
    }

    public List<Map<String, Object>> listCompanies(
        TaxAnalyticsPeriod period,
        TaxAnalyticsWeekWindow week,
        String regionCode,
        String districtCode,
        String connectionStatus,
        String search,
        int limit,
        int offset
    ) {
        StringBuilder sql = new StringBuilder();
        sql.append("WITH connected AS ( ").append(TaxAnalyticsConnectedSql.SQL).append(" ), ");
        sql.append("""
            period_turnover AS (
              SELECT COALESCE(s.company_id, st.company_id) AS company_id,
                     COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS fiscal_turnover,
                     COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS non_fiscal_turnover
              FROM sales s
              LEFT JOIN stores st ON st.id = s.store_id
              WHERE s.status = 'COMPLETED'
                AND s.created_at >= ? AND s.created_at < ?
              GROUP BY COALESCE(s.company_id, st.company_id)
            ),
            week_turnover AS (
              SELECT COALESCE(s.company_id, st.company_id) AS company_id,
                     COALESCE(SUM(s.total_amount), 0) AS total_turnover
              FROM sales s
              LEFT JOIN stores st ON st.id = s.store_id
              WHERE s.status = 'COMPLETED'
                AND s.created_at >= ? AND s.created_at < ?
              GROUP BY COALESCE(s.company_id, st.company_id)
            ),
            prev_week_turnover AS (
              SELECT COALESCE(s.company_id, st.company_id) AS company_id,
                     COALESCE(SUM(s.total_amount), 0) AS total_turnover
              FROM sales s
              LEFT JOIN stores st ON st.id = s.store_id
              WHERE s.status = 'COMPLETED'
                AND s.created_at >= ? AND s.created_at < ?
              GROUP BY COALESCE(s.company_id, st.company_id)
            )
            SELECT c.id AS company_id,
                   c.name AS name,
                   c.tin AS tin,
                   c.region_code AS region_code,
                   gr.name_ru AS region_name_ru,
                   gr.name_uz AS region_name_uz,
                   c.district_code AS district_code,
                   gd.name_ru AS district_name_ru,
                   gd.name_uz AS district_name_uz,
                   CASE WHEN conn.company_id IS NOT NULL THEN 1 ELSE 0 END AS connected,
                   COALESCE(pt.fiscal_turnover, 0) AS fiscal_turnover,
                   COALESCE(pt.non_fiscal_turnover, 0) AS non_fiscal_turnover,
                   COALESCE(wt.total_turnover, 0) AS week_turnover,
                   COALESCE(pwt.total_turnover, 0) AS prev_week_turnover
            FROM companies c
            LEFT JOIN geo_regions gr ON gr.code = c.region_code
            LEFT JOIN geo_districts gd ON gd.code = c.district_code
            LEFT JOIN connected conn ON conn.company_id = c.id
            LEFT JOIN period_turnover pt ON pt.company_id = c.id
            LEFT JOIN week_turnover wt ON wt.company_id = c.id
            LEFT JOIN prev_week_turnover pwt ON pwt.company_id = c.id
            WHERE 1=1
            """);
        List<Object> args = new ArrayList<>();
        args.add(ts(period.from()));
        args.add(ts(period.to().plusDays(1)));
        args.add(ts(week.weekFrom()));
        args.add(ts(week.weekTo().plusDays(1)));
        args.add(ts(week.prevWeekFrom()));
        args.add(ts(week.prevWeekTo().plusDays(1)));
        appendFilters(sql, args, regionCode, districtCode, connectionStatus, search);
        sql.append(" ORDER BY COALESCE(wt.total_turnover, 0) DESC, c.name ASC LIMIT ? OFFSET ? ");
        args.add(limit);
        args.add(offset);
        return jdbc.queryForList(sql.toString(), args.toArray());
    }

    public Map<String, Object> findCompany(int companyId) {
        String sql = "WITH connected AS ( " + TaxAnalyticsConnectedSql.SQL + " ) "
            + """
            SELECT c.id AS company_id,
                   c.name AS name,
                   c.tin AS tin,
                   c.region_code AS region_code,
                   gr.name_ru AS region_name_ru,
                   gr.name_uz AS region_name_uz,
                   c.district_code AS district_code,
                   gd.name_ru AS district_name_ru,
                   gd.name_uz AS district_name_uz,
                   CASE WHEN conn.company_id IS NOT NULL THEN 1 ELSE 0 END AS connected
            FROM companies c
            LEFT JOIN geo_regions gr ON gr.code = c.region_code
            LEFT JOIN geo_districts gd ON gd.code = c.district_code
            LEFT JOIN connected conn ON conn.company_id = c.id
            WHERE c.id = ?
            """;
        List<Map<String, Object>> rows = jdbc.queryForList(sql, companyId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public Map<String, Object> periodTurnover(int companyId, TaxAnalyticsPeriod period) {
        String sql = """
            SELECT COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS fiscal_turnover,
                   COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS non_fiscal_turnover
            FROM sales s
            LEFT JOIN stores st ON st.id = s.store_id
            WHERE s.status = 'COMPLETED'
              AND COALESCE(s.company_id, st.company_id) = ?
              AND s.created_at >= ? AND s.created_at < ?
            """;
        return jdbc.queryForMap(sql, companyId, ts(period.from()), ts(period.to().plusDays(1)));
    }

    public List<Map<String, Object>> dailyTurnover(int companyId, LocalDate fromInclusive, LocalDate toExclusive) {
        String sql = """
            SELECT (s.created_at AT TIME ZONE 'Asia/Tashkent')::date AS sale_date,
                   COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS fiscal_turnover,
                   COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS non_fiscal_turnover
            FROM sales s
            LEFT JOIN stores st ON st.id = s.store_id
            WHERE s.status = 'COMPLETED'
              AND COALESCE(s.company_id, st.company_id) = ?
              AND s.created_at >= ? AND s.created_at < ?
            GROUP BY 1
            """;
        return jdbc.queryForList(sql, companyId, ts(fromInclusive), ts(toExclusive));
    }

    private static void appendFilters(
        StringBuilder sql,
        List<Object> args,
        String regionCode,
        String districtCode,
        String connectionStatus,
        String search
    ) {
        if (regionCode != null && !regionCode.isBlank()) {
            sql.append(" AND c.region_code = ? ");
            args.add(regionCode);
        }
        if (districtCode != null && !districtCode.isBlank()) {
            sql.append(" AND c.district_code = ? ");
            args.add(districtCode);
        }
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
    }

    private static Timestamp ts(LocalDate date) {
        Instant instant = date.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant();
        return Timestamp.from(instant);
    }
}
