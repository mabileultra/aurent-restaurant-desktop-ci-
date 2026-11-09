package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsCompanyFilter;
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
public class TaxAnalyticsProductQueryRepository {

    private final JdbcTemplate jdbc;

    public List<Map<String, Object>> rankedProducts(
        TaxAnalyticsPeriod period,
        String regionCode,
        String districtCode,
        String businessType,
        boolean ascending,
        int limit
    ) {
        StringBuilder sql = new StringBuilder("""
            SELECT si.product_name AS product_name,
                   COALESCE(SUM(si.quantity - COALESCE(si.returned_quantity, 0)), 0) AS quantity,
                   COALESCE(SUM(si.line_total), 0) AS amount
            FROM sale_items si
            JOIN sales s ON s.id = si.sale_id
            LEFT JOIN stores st ON st.id = s.store_id
            JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
            WHERE s.status = 'COMPLETED'
              AND s.created_at >= ? AND s.created_at < ?
              AND NULLIF(BTRIM(si.product_name), '') IS NOT NULL
            """);
        List<Object> args = new ArrayList<>();
        args.add(ts(period.from()));
        args.add(ts(period.to().plusDays(1)));
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, null, null);
        sql.append(" GROUP BY si.product_name ");
        sql.append(ascending
            ? " ORDER BY amount ASC, quantity ASC, product_name ASC "
            : " ORDER BY amount DESC, quantity DESC, product_name ASC ");
        sql.append(" LIMIT ? ");
        args.add(Math.min(Math.max(limit, 1), 100));
        return jdbc.queryForList(sql.toString(), args.toArray());
    }

    private static Timestamp ts(LocalDate day) {
        return Timestamp.from(day.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant());
    }
}
