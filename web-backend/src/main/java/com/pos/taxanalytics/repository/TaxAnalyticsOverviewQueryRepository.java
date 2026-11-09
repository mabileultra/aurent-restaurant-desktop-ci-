package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsCompanyFilter;
import com.pos.taxanalytics.support.TaxAnalyticsConnectedSql;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsWeekWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsOverviewQueryRepository {

    private final JdbcTemplate jdbc;

    public long countCompanies(
        String regionCode,
        String districtCode,
        String businessType,
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
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, connectionStatus, search);
        Long count = jdbc.queryForObject(sql.toString(), Long.class, args.toArray());
        return count == null ? 0L : count;
    }

    public long countConnected(
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search
    ) {
        if ("NOT_CONNECTED".equalsIgnoreCase(connectionStatus)) {
            return 0L;
        }
        StringBuilder sql = new StringBuilder();
        sql.append("WITH connected AS ( ").append(TaxAnalyticsConnectedSql.SQL).append(" ) ");
        sql.append("""
            SELECT COUNT(*)
            FROM companies c
            JOIN connected conn ON conn.company_id = c.id
            WHERE 1=1
            """);
        List<Object> args = new ArrayList<>();
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, null, search);
        Long count = jdbc.queryForObject(sql.toString(), Long.class, args.toArray());
        return count == null ? 0L : count;
    }

    public BigDecimal sumTurnover(
        TaxAnalyticsPeriod period,
        boolean fiscalOnly,
        boolean nonFiscalOnly,
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search
    ) {
        StringBuilder sql = new StringBuilder();
        sql.append("WITH connected AS ( ").append(TaxAnalyticsConnectedSql.SQL).append(" ) ");
        sql.append("""
            SELECT COALESCE(SUM(s.total_amount), 0)
            FROM sales s
            LEFT JOIN stores st ON st.id = s.store_id
            JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
            LEFT JOIN connected conn ON conn.company_id = c.id
            WHERE s.status = 'COMPLETED'
              AND s.created_at >= ? AND s.created_at < ?
            """);
        if (fiscalOnly) {
            sql.append(" AND s.fiscal_status = 'FISCALIZED' ");
        } else if (nonFiscalOnly) {
            sql.append(" AND s.fiscal_status IS DISTINCT FROM 'FISCALIZED' ");
        }
        List<Object> args = new ArrayList<>();
        args.add(ts(period.from()));
        args.add(ts(period.to().plusDays(1)));
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, connectionStatus, search);
        BigDecimal value = jdbc.queryForObject(sql.toString(), BigDecimal.class, args.toArray());
        return value == null ? BigDecimal.ZERO : value;
    }

    public List<Map<String, Object>> regionEnterpriseCounts(
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search
    ) {
        StringBuilder sql = new StringBuilder();
        sql.append("WITH connected AS ( ").append(TaxAnalyticsConnectedSql.SQL).append(" ) ");
        sql.append("""
            SELECT c.region_code AS region_code, COUNT(*) AS cnt
            FROM companies c
            LEFT JOIN connected conn ON conn.company_id = c.id
            WHERE c.region_code IS NOT NULL
            """);
        List<Object> args = new ArrayList<>();
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, connectionStatus, search);
        sql.append(" GROUP BY c.region_code ");
        return jdbc.queryForList(sql.toString(), args.toArray());
    }

    public List<Map<String, Object>> regionTurnover(
        TaxAnalyticsPeriod period,
        String regionCode,
        String districtCode,
        String businessType,
        String connectionStatus,
        String search
    ) {
        StringBuilder sql = new StringBuilder();
        sql.append("WITH connected AS ( ").append(TaxAnalyticsConnectedSql.SQL).append(" ) ");
        sql.append("""
            SELECT c.region_code AS region_code, COALESCE(SUM(s.total_amount), 0) AS turnover
            FROM sales s
            LEFT JOIN stores st ON st.id = s.store_id
            JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
            LEFT JOIN connected conn ON conn.company_id = c.id
            WHERE s.status = 'COMPLETED'
              AND s.created_at >= ? AND s.created_at < ?
              AND c.region_code IS NOT NULL
            """);
        List<Object> args = new ArrayList<>();
        args.add(ts(period.from()));
        args.add(ts(period.to().plusDays(1)));
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, connectionStatus, search);
        sql.append(" GROUP BY c.region_code ");
        return jdbc.queryForList(sql.toString(), args.toArray());
    }

    private static Timestamp ts(LocalDate day) {
        return Timestamp.from(day.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant());
    }
}
