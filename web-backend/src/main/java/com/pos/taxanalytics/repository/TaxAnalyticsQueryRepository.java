package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsCompanyFilter;
import com.pos.taxanalytics.support.TaxAnalyticsConnectedSql;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsQueryRepository {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final JdbcTemplate jdbc;

    public long countCompanies() {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM companies", Long.class);
        return n == null ? 0L : n;
    }

    public long countConnectedCompanies() {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM (" + TaxAnalyticsConnectedSql.SQL + ") x", Long.class);
        return n == null ? 0L : n;
    }

    public List<Integer> listConnectedCompanyIds() {
        return jdbc.queryForList(TaxAnalyticsConnectedSql.SQL, Integer.class);
    }

    public BigDecimal sumTurnover(TaxAnalyticsPeriod period, boolean fiscalOnly, boolean nonFiscalOnly) {
        String fiscalClause = "";
        if (fiscalOnly) {
            fiscalClause = " AND s.fiscal_status = 'FISCALIZED' ";
        } else if (nonFiscalOnly) {
            fiscalClause = " AND s.fiscal_status IS DISTINCT FROM 'FISCALIZED' ";
        }
        String sql = """
            SELECT COALESCE(SUM(s.total_amount), 0)
            FROM sales s
            WHERE s.status = 'COMPLETED'
              AND s.created_at >= ? AND s.created_at < ?
            """ + fiscalClause;
        BigDecimal v = jdbc.queryForObject(sql, BigDecimal.class, ts(period.from()), ts(period.to().plusDays(1)));
        return v == null ? BigDecimal.ZERO : v;
    }

    public long countNewFiscalConnections(TaxAnalyticsPeriod period) {
        String sql = """
            SELECT COUNT(*) FROM (
              SELECT COALESCE(s.company_id, st.company_id) AS company_id
              FROM sales s
              LEFT JOIN stores st ON st.id = s.store_id
              WHERE s.status = 'COMPLETED'
                AND s.fiscal_status = 'FISCALIZED'
                AND COALESCE(s.company_id, st.company_id) IS NOT NULL
              GROUP BY COALESCE(s.company_id, st.company_id)
              HAVING MIN(COALESCE(s.fiscalized_at, s.created_at)) >= ?
                 AND MIN(COALESCE(s.fiscalized_at, s.created_at)) < ?
            ) t
            """;
        Long n = jdbc.queryForObject(sql, Long.class, ts(period.from()), ts(period.to().plusDays(1)));
        return n == null ? 0L : n;
    }

    public long countFiscalErrors(TaxAnalyticsPeriod period) {
        String sql = """
            SELECT COUNT(*) FROM sales s
            WHERE s.status = 'COMPLETED'
              AND s.fiscal_status = 'FISCAL_FAILED'
              AND s.created_at >= ? AND s.created_at < ?
            """;
        Long n = jdbc.queryForObject(sql, Long.class, ts(period.from()), ts(period.to().plusDays(1)));
        return n == null ? 0L : n;
    }

    public List<Map<String, Object>> listRegions() {
        return jdbc.queryForList("""
            SELECT code, name_ru, name_uz, sort_order
            FROM geo_regions
            WHERE active = TRUE
            ORDER BY sort_order ASC, code ASC
            """);
    }

    public List<Map<String, Object>> regionEnterpriseCounts() {
        return jdbc.queryForList("""
            SELECT c.region_code AS region_code, COUNT(*) AS cnt
            FROM companies c
            WHERE c.region_code IS NOT NULL
            GROUP BY c.region_code
            """);
    }

    public List<Map<String, Object>> regionTurnover(TaxAnalyticsPeriod period) {
        String sql = """
            SELECT c.region_code AS region_code, COALESCE(SUM(s.total_amount), 0) AS turnover
            FROM sales s
            LEFT JOIN stores st ON st.id = s.store_id
            LEFT JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
            WHERE s.status = 'COMPLETED'
              AND s.created_at >= ? AND s.created_at < ?
              AND c.region_code IS NOT NULL
            GROUP BY c.region_code
            """;
        return jdbc.queryForList(sql, ts(period.from()), ts(period.to().plusDays(1)));
    }

    public List<Map<String, Object>> aggregateEnterprises(
        TaxAnalyticsPeriod period,
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search,
        int limit,
        int offset
    ) {
        StringBuilder sql = new StringBuilder("""
            WITH connected AS (
            """);
        sql.append(TaxAnalyticsConnectedSql.SQL);
        sql.append("""
            ),
            turnover AS (
              SELECT COALESCE(s.company_id, st.company_id) AS company_id,
                     COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS fiscal_turnover,
                     COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS non_fiscal_turnover
              FROM sales s
              LEFT JOIN stores st ON st.id = s.store_id
              WHERE s.status = 'COMPLETED'
                AND s.created_at >= ? AND s.created_at < ?
              GROUP BY COALESCE(s.company_id, st.company_id)
            ),
            prev_turnover AS (
              SELECT COALESCE(s.company_id, st.company_id) AS company_id,
                     COALESCE(SUM(s.total_amount), 0) AS total_turnover
              FROM sales s
              LEFT JOIN stores st ON st.id = s.store_id
              WHERE s.status = 'COMPLETED'
                AND s.created_at >= ? AND s.created_at < ?
              GROUP BY COALESCE(s.company_id, st.company_id)
            )
            SELECT c.id::text AS code,
                   c.name AS name_ru,
                   c.name AS name_uz,
                   c.tin,
                   CASE WHEN conn.company_id IS NOT NULL THEN 1 ELSE 0 END AS connected,
                   COALESCE(t.fiscal_turnover, 0) AS fiscal_turnover,
                   COALESCE(t.non_fiscal_turnover, 0) AS non_fiscal_turnover,
                   COALESCE(pt.total_turnover, 0) AS prev_turnover
            FROM companies c
            LEFT JOIN connected conn ON conn.company_id = c.id
            LEFT JOIN turnover t ON t.company_id = c.id
            LEFT JOIN prev_turnover pt ON pt.company_id = c.id
            WHERE 1=1
            """);
        List<Object> args = new ArrayList<>();
        args.add(ts(period.from()));
        args.add(ts(period.to().plusDays(1)));
        args.add(ts(period.prevFrom()));
        args.add(ts(period.prevTo().plusDays(1)));
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, connectionStatus, search);
        sql.append(" ORDER BY c.name ASC LIMIT ? OFFSET ? ");
        args.add(limit);
        args.add(offset);
        return jdbc.queryForList(sql.toString(), args.toArray());
    }

    public long countEnterprises(
        TaxAnalyticsPeriod period,
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search
    ) {
        StringBuilder sql = new StringBuilder("""
            WITH connected AS (
            """);
        sql.append(TaxAnalyticsConnectedSql.SQL);
        sql.append("""
            )
            SELECT COUNT(*) FROM companies c
            LEFT JOIN connected conn ON conn.company_id = c.id
            WHERE 1=1
            """);
        List<Object> args = new ArrayList<>();
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, connectionStatus, search);
        Long n = args.isEmpty()
            ? jdbc.queryForObject(sql.toString(), Long.class)
            : jdbc.queryForObject(sql.toString(), Long.class, args.toArray());
        return n == null ? 0L : n;
    }

    public Map<String, Long> toLongMap(List<Map<String, Object>> rows, String keyCol, String valCol) {
        Map<String, Long> map = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Object k = row.get(keyCol);
            if (k == null) continue;
            map.put(String.valueOf(k), ((Number) row.get(valCol)).longValue());
        }
        return map;
    }

    public Map<String, BigDecimal> toDecimalMap(List<Map<String, Object>> rows, String keyCol, String valCol) {
        Map<String, BigDecimal> map = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Object k = row.get(keyCol);
            if (k == null) continue;
            Object v = row.get(valCol);
            map.put(String.valueOf(k), v == null ? BigDecimal.ZERO : new BigDecimal(v.toString()));
        }
        return map;
    }

    private static Timestamp ts(LocalDate date) {
        Instant instant = date.atStartOfDay(ZONE).toInstant();
        return Timestamp.from(instant);
    }
}
