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

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsGeoAggregateRepository {

    private final JdbcTemplate jdbc;

    public List<Map<String, Object>> aggregateByRegion(
        TaxAnalyticsPeriod period,
        String connectionStatus,
        String businessType
    ) {
        return aggregateGeo(period, null, "region", connectionStatus, businessType);
    }

    public List<Map<String, Object>> aggregateByDistrict(
        TaxAnalyticsPeriod period,
        String regionCode,
        String connectionStatus,
        String businessType
    ) {
        return aggregateGeo(period, regionCode, "district", connectionStatus, businessType);
    }

    private List<Map<String, Object>> aggregateGeo(
        TaxAnalyticsPeriod period,
        String regionCode,
        String mode,
        String connectionStatus,
        String businessType
    ) {
        boolean district = "district".equals(mode);
        String groupCol = district ? "c.district_code" : "c.region_code";
        String nameJoin = district
            ? "LEFT JOIN geo_districts g ON g.code = agg.geo_code"
            : "LEFT JOIN geo_regions g ON g.code = agg.geo_code";
        boolean filterRegion = regionCode != null && !regionCode.isBlank();

        StringBuilder sql = new StringBuilder();
        sql.append("WITH connected AS ( ").append(TaxAnalyticsConnectedSql.SQL).append(" ), ");
        sql.append("companies_geo AS ( ");
        sql.append("SELECT c.id, ").append(groupCol).append(" AS geo_code, ");
        sql.append("CASE WHEN conn.company_id IS NOT NULL THEN 1 ELSE 0 END AS is_connected ");
        sql.append("FROM companies c ");
        sql.append("LEFT JOIN connected conn ON conn.company_id = c.id ");
        sql.append("WHERE ").append(groupCol).append(" IS NOT NULL ");
        List<Object> args = new ArrayList<>();
        appendConnection(sql, connectionStatus);
        appendBusinessType(sql, args, businessType);
        if (filterRegion) {
            sql.append("AND c.region_code = ? ");
            args.add(regionCode);
        }
        sql.append("), ");
        sql.append("turnover AS ( ");
        sql.append("SELECT ").append(groupCol).append(" AS geo_code, ");
        sql.append("COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS fiscal_turnover, ");
        sql.append("COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS non_fiscal_turnover ");
        sql.append("FROM sales s ");
        sql.append("LEFT JOIN stores st ON st.id = s.store_id ");
        sql.append("JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id) ");
        sql.append("LEFT JOIN connected conn ON conn.company_id = c.id ");
        sql.append("WHERE s.status = 'COMPLETED' ");
        sql.append("AND s.created_at >= ? AND s.created_at < ? ");
        sql.append("AND ").append(groupCol).append(" IS NOT NULL ");
        args.add(ts(period.from()));
        args.add(ts(period.to().plusDays(1)));
        appendConnection(sql, connectionStatus);
        appendBusinessType(sql, args, businessType);
        if (filterRegion) {
            sql.append("AND c.region_code = ? ");
            args.add(regionCode);
        }
        sql.append("GROUP BY ").append(groupCol).append(" ), ");
        sql.append("prev_turnover AS ( ");
        sql.append("SELECT ").append(groupCol).append(" AS geo_code, ");
        sql.append("COALESCE(SUM(s.total_amount), 0) AS total_turnover ");
        sql.append("FROM sales s ");
        sql.append("LEFT JOIN stores st ON st.id = s.store_id ");
        sql.append("JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id) ");
        sql.append("LEFT JOIN connected conn ON conn.company_id = c.id ");
        sql.append("WHERE s.status = 'COMPLETED' ");
        sql.append("AND s.created_at >= ? AND s.created_at < ? ");
        sql.append("AND ").append(groupCol).append(" IS NOT NULL ");
        args.add(ts(period.prevFrom()));
        args.add(ts(period.prevTo().plusDays(1)));
        appendConnection(sql, connectionStatus);
        appendBusinessType(sql, args, businessType);
        if (filterRegion) {
            sql.append("AND c.region_code = ? ");
            args.add(regionCode);
        }
        sql.append("GROUP BY ").append(groupCol).append(" ), ");
        sql.append("agg AS ( ");
        sql.append("SELECT geo_code, COUNT(*) AS enterprises, SUM(is_connected) AS connected ");
        sql.append("FROM companies_geo GROUP BY geo_code ) ");
        sql.append("SELECT agg.geo_code AS code, g.name_ru, g.name_uz, ");
        sql.append("agg.enterprises, agg.connected, ");
        sql.append("COALESCE(t.fiscal_turnover, 0) AS fiscal_turnover, ");
        sql.append("COALESCE(t.non_fiscal_turnover, 0) AS non_fiscal_turnover, ");
        sql.append("COALESCE(pt.total_turnover, 0) AS prev_turnover ");
        sql.append("FROM agg ");
        sql.append(nameJoin).append(' ');
        sql.append("LEFT JOIN turnover t ON t.geo_code = agg.geo_code ");
        sql.append("LEFT JOIN prev_turnover pt ON pt.geo_code = agg.geo_code ");
        sql.append("ORDER BY g.sort_order NULLS LAST, agg.geo_code");
        return jdbc.queryForList(sql.toString(), args.toArray());
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
