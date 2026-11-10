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
        StringBuilder filter = new StringBuilder();
        List<Object> filterArgs = new ArrayList<>();
        TaxAnalyticsCompanyFilter.append(filter, filterArgs, regionCode, districtCode, businessType, null, null);

        String order = ascending
            ? " ORDER BY a.amount ASC, a.quantity ASC, a.product_name ASC "
            : " ORDER BY a.amount DESC, a.quantity DESC, a.product_name ASC ";

        String sql = """
            WITH base AS (
              SELECT si.product_name AS product_name,
                     c.id AS company_id,
                     c.name AS company_name,
                     COALESCE(SUM(si.quantity - COALESCE(si.returned_quantity, 0)), 0) AS quantity,
                     COALESCE(SUM(si.line_total), 0) AS amount
              FROM sale_items si
              JOIN sales s ON s.id = si.sale_id
              LEFT JOIN stores st ON st.id = s.store_id
              JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
              WHERE s.status = 'COMPLETED'
                AND s.created_at >= ? AND s.created_at < ?
                AND NULLIF(BTRIM(si.product_name), '') IS NOT NULL
            """ + filter + """
              GROUP BY si.product_name, c.id, c.name
            ),
            agg AS (
              SELECT product_name,
                     COALESCE(SUM(quantity), 0) AS quantity,
                     COALESCE(SUM(amount), 0) AS amount
              FROM base
              GROUP BY product_name
            ),
            ranked_company AS (
              SELECT product_name, company_name,
                     ROW_NUMBER() OVER (PARTITION BY product_name ORDER BY amount DESC, company_id) AS rn
              FROM base
            )
            SELECT a.product_name AS product_name,
                   a.quantity AS quantity,
                   a.amount AS amount,
                   rc.company_name AS company_name,
                   CASE WHEN a.quantity > 0 THEN ROUND(a.amount / a.quantity, 2) ELSE 0 END AS unit_price
            FROM agg a
            LEFT JOIN ranked_company rc ON rc.product_name = a.product_name AND rc.rn = 1
            """ + order + """
            LIMIT ?
            """;

        List<Object> args = new ArrayList<>();
        args.add(ts(period.from()));
        args.add(ts(period.to().plusDays(1)));
        args.addAll(filterArgs);
        args.add(Math.min(Math.max(limit, 1), 100));
        return jdbc.queryForList(sql, args.toArray());
    }

    private static Timestamp ts(LocalDate day) {
        return Timestamp.from(day.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant());
    }
}
