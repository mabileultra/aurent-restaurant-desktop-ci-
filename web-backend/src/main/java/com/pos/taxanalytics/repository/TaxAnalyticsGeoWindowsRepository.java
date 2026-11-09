package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsConnectedSql;
import com.pos.taxanalytics.support.TaxAnalyticsWeekWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Rolling week / today / YTD turnover by region or district code. */
@Repository
@RequiredArgsConstructor
public class TaxAnalyticsGeoWindowsRepository {

    private final JdbcTemplate jdbc;

    public Map<String, Map<String, Object>> byRegion(String connectionStatus, String businessType) {
        return index(query(false, null, connectionStatus, businessType));
    }

    public Map<String, Map<String, Object>> byDistrict(
        String regionCode,
        String connectionStatus,
        String businessType
    ) {
        return index(query(true, regionCode, connectionStatus, businessType));
    }

    private List<Map<String, Object>> query(
        boolean district,
        String regionCode,
        String connectionStatus,
        String businessType
    ) {
        TaxAnalyticsWeekWindow week = TaxAnalyticsWeekWindow.current();
        LocalDate today = LocalDate.now(TaxAnalyticsWeekWindow.ZONE);
        LocalDate yearStart = LocalDate.of(today.getYear(), 1, 1);
        String groupCol = district ? "c.district_code" : "c.region_code";
        boolean filterRegion = regionCode != null && !regionCode.isBlank();

        StringBuilder sql = new StringBuilder();
        sql.append("WITH connected AS ( ").append(TaxAnalyticsConnectedSql.SQL).append(" ), ");
        sql.append(windowCte("week_turnover", groupCol, connectionStatus, businessType, filterRegion));
        sql.append(", ");
        sql.append(windowCte("prev_week_turnover", groupCol, connectionStatus, businessType, filterRegion));
        sql.append(", ");
        sql.append(windowCte("today_turnover", groupCol, connectionStatus, businessType, filterRegion));
        sql.append(", ");
        sql.append(windowCte("year_turnover", groupCol, connectionStatus, businessType, filterRegion));
        sql.append("""
            SELECT COALESCE(w.geo_code, pw.geo_code, t.geo_code, y.geo_code) AS code,
                   COALESCE(w.total_turnover, 0) AS week_turnover,
                   COALESCE(pw.total_turnover, 0) AS prev_week_turnover,
                   COALESCE(t.total_turnover, 0) AS today_turnover,
                   COALESCE(y.total_turnover, 0) AS year_turnover
            FROM week_turnover w
            FULL OUTER JOIN prev_week_turnover pw ON pw.geo_code = w.geo_code
            FULL OUTER JOIN today_turnover t ON t.geo_code = COALESCE(w.geo_code, pw.geo_code)
            FULL OUTER JOIN year_turnover y ON y.geo_code = COALESCE(w.geo_code, pw.geo_code, t.geo_code)
            """);

        List<Object> args = new ArrayList<>();
        appendWindowArgs(args, week.weekFrom(), week.weekTo().plusDays(1), connectionStatus, businessType, filterRegion, regionCode);
        appendWindowArgs(args, week.prevWeekFrom(), week.prevWeekTo().plusDays(1), connectionStatus, businessType, filterRegion, regionCode);
        appendWindowArgs(args, today, today.plusDays(1), connectionStatus, businessType, filterRegion, regionCode);
        appendWindowArgs(args, yearStart, today.plusDays(1), connectionStatus, businessType, filterRegion, regionCode);
        return jdbc.queryForList(sql.toString(), args.toArray());
    }

    private static String windowCte(
        String name,
        String groupCol,
        String connectionStatus,
        String businessType,
        boolean filterRegion
    ) {
        StringBuilder sql = new StringBuilder();
        sql.append(name).append(" AS ( ");
        sql.append("SELECT ").append(groupCol).append(" AS geo_code, ");
        sql.append("COALESCE(SUM(s.total_amount), 0) AS total_turnover ");
        sql.append("FROM sales s ");
        sql.append("LEFT JOIN stores st ON st.id = s.store_id ");
        sql.append("JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id) ");
        sql.append("LEFT JOIN connected conn ON conn.company_id = c.id ");
        sql.append("WHERE s.status = 'COMPLETED' ");
        sql.append("AND s.created_at >= ? AND s.created_at < ? ");
        sql.append("AND ").append(groupCol).append(" IS NOT NULL ");
        appendConnection(sql, connectionStatus);
        if (businessType != null && !businessType.isBlank()) {
            sql.append(" AND UPPER(c.business_type) = ? ");
        }
        if (filterRegion) {
            sql.append(" AND c.region_code = ? ");
        }
        sql.append(" GROUP BY ").append(groupCol).append(" ) ");
        return sql.toString();
    }

    private static void appendWindowArgs(
        List<Object> args,
        LocalDate from,
        LocalDate toExclusive,
        String connectionStatus,
        String businessType,
        boolean filterRegion,
        String regionCode
    ) {
        args.add(ts(from));
        args.add(ts(toExclusive));
        if (businessType != null && !businessType.isBlank()) {
            args.add(businessType.trim().toUpperCase());
        }
        if (filterRegion) {
            args.add(regionCode);
        }
    }

    private static void appendConnection(StringBuilder sql, String connectionStatus) {
        if ("CONNECTED".equalsIgnoreCase(connectionStatus)) {
            sql.append(" AND conn.company_id IS NOT NULL ");
        } else if ("NOT_CONNECTED".equalsIgnoreCase(connectionStatus)) {
            sql.append(" AND conn.company_id IS NULL ");
        }
    }

    private static Map<String, Map<String, Object>> index(List<Map<String, Object>> rows) {
        Map<String, Map<String, Object>> map = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Object code = row.get("code");
            if (code != null) {
                map.put(String.valueOf(code), row);
            }
        }
        return map;
    }

    private static Timestamp ts(LocalDate date) {
        return Timestamp.from(date.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant());
    }
}
