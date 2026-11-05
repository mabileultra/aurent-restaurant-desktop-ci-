package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsConnectedSql;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsMissingRegionRepository {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final JdbcTemplate jdbc;

    public Map<String, Object> totals(TaxAnalyticsPeriod period) {
        String sql = """
            WITH connected AS ( %s ),
            missing AS (
              SELECT c.id,
                     CASE WHEN conn.company_id IS NOT NULL THEN 1 ELSE 0 END AS is_connected
              FROM companies c
              LEFT JOIN connected conn ON conn.company_id = c.id
              WHERE c.region_code IS NULL
            ),
            turnover AS (
              SELECT
                COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS fiscal_turnover,
                COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS non_fiscal_turnover
              FROM sales s
              LEFT JOIN stores st ON st.id = s.store_id
              JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
              WHERE s.status = 'COMPLETED'
                AND c.region_code IS NULL
                AND s.created_at >= ? AND s.created_at < ?
            ),
            prev_turnover AS (
              SELECT COALESCE(SUM(s.total_amount), 0) AS total_turnover
              FROM sales s
              LEFT JOIN stores st ON st.id = s.store_id
              JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
              WHERE s.status = 'COMPLETED'
                AND c.region_code IS NULL
                AND s.created_at >= ? AND s.created_at < ?
            )
            SELECT
              COALESCE((SELECT COUNT(*) FROM missing), 0) AS enterprises,
              COALESCE((SELECT SUM(is_connected) FROM missing), 0) AS connected,
              COALESCE((SELECT fiscal_turnover FROM turnover), 0) AS fiscal_turnover,
              COALESCE((SELECT non_fiscal_turnover FROM turnover), 0) AS non_fiscal_turnover,
              COALESCE((SELECT total_turnover FROM prev_turnover), 0) AS prev_turnover
            """.formatted(TaxAnalyticsConnectedSql.SQL);
        return jdbc.queryForMap(
            sql,
            ts(period.from()),
            ts(period.to().plusDays(1)),
            ts(period.prevFrom()),
            ts(period.prevTo().plusDays(1))
        );
    }

    private static Timestamp ts(LocalDate day) {
        return Timestamp.from(day.atStartOfDay(ZONE).toInstant());
    }

    public static boolean hasSignal(Map<String, Object> row) {
        long enterprises = ((Number) row.get("enterprises")).longValue();
        BigDecimal fiscal = new BigDecimal(row.get("fiscal_turnover").toString());
        BigDecimal nonFiscal = new BigDecimal(row.get("non_fiscal_turnover").toString());
        return enterprises > 0 || fiscal.signum() != 0 || nonFiscal.signum() != 0;
    }
}
