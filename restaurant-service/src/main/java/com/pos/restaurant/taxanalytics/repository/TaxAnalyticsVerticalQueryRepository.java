package com.pos.restaurant.taxanalytics.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsVerticalQueryRepository {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final JdbcTemplate jdbc;

    public List<Integer> connectedCompanyIds() {
        return jdbc.queryForList("""
            SELECT DISTINCT company_id
            FROM edge_multikassa
            WHERE enabled = TRUE AND company_id IS NOT NULL
            """, Integer.class);
    }

    public List<Map<String, Object>> companyTurnover(
        LocalDate periodFrom,
        LocalDate periodToExclusive,
        LocalDate weekFrom,
        LocalDate weekToExclusive,
        LocalDate prevWeekFrom,
        LocalDate prevWeekToExclusive
    ) {
        String sql = """
            WITH period AS (
              SELECT o.company_id AS company_id,
                     COALESCE(SUM(p.amount), 0) AS non_fiscal_turnover
              FROM floor_order_payments p
              JOIN floor_orders o ON o.id = p.order_id
              WHERE o.status = 'CLOSED'
                AND p.paid_at >= ? AND p.paid_at < ?
              GROUP BY o.company_id
            ),
            week AS (
              SELECT o.company_id AS company_id,
                     COALESCE(SUM(p.amount), 0) AS total_turnover
              FROM floor_order_payments p
              JOIN floor_orders o ON o.id = p.order_id
              WHERE o.status = 'CLOSED'
                AND p.paid_at >= ? AND p.paid_at < ?
              GROUP BY o.company_id
            ),
            prev_week AS (
              SELECT o.company_id AS company_id,
                     COALESCE(SUM(p.amount), 0) AS total_turnover
              FROM floor_order_payments p
              JOIN floor_orders o ON o.id = p.order_id
              WHERE o.status = 'CLOSED'
                AND p.paid_at >= ? AND p.paid_at < ?
              GROUP BY o.company_id
            )
            SELECT COALESCE(period.company_id, week.company_id, prev_week.company_id) AS company_id,
                   0 AS fiscal_turnover,
                   COALESCE(period.non_fiscal_turnover, 0) AS non_fiscal_turnover,
                   COALESCE(week.total_turnover, 0) AS week_turnover,
                   COALESCE(prev_week.total_turnover, 0) AS prev_week_turnover
            FROM period
            FULL OUTER JOIN week ON week.company_id = period.company_id
            FULL OUTER JOIN prev_week ON prev_week.company_id = COALESCE(period.company_id, week.company_id)
            """;
        return jdbc.queryForList(
            sql,
            ts(periodFrom), ts(periodToExclusive),
            ts(weekFrom), ts(weekToExclusive),
            ts(prevWeekFrom), ts(prevWeekToExclusive)
        );
    }

    public List<Map<String, Object>> dailyTurnover(int companyId, LocalDate from, LocalDate toExclusive) {
        return jdbc.queryForList("""
            SELECT (p.paid_at AT TIME ZONE 'Asia/Tashkent')::date AS sale_date,
                   0 AS fiscal_turnover,
                   COALESCE(SUM(p.amount), 0) AS non_fiscal_turnover
            FROM floor_order_payments p
            JOIN floor_orders o ON o.id = p.order_id
            WHERE o.status = 'CLOSED'
              AND o.company_id = ?
              AND p.paid_at >= ? AND p.paid_at < ?
            GROUP BY 1
            ORDER BY 1
            """, companyId, ts(from), ts(toExclusive));
    }

    private static Timestamp ts(LocalDate date) {
        Instant instant = date.atStartOfDay(ZONE).toInstant();
        return Timestamp.from(instant);
    }
}
