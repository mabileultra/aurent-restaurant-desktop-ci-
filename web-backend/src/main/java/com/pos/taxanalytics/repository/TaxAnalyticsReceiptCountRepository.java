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
public class TaxAnalyticsReceiptCountRepository {

    private final JdbcTemplate jdbc;

    public Map<String, Object> counts(
        TaxAnalyticsPeriod period,
        String regionCode,
        String districtCode,
        String businessType
    ) {
        StringBuilder sql = new StringBuilder("""
            SELECT COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN 1 ELSE 0 END), 0) AS fiscal_receipt_count,
                   COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN 1 ELSE 0 END), 0) AS non_fiscal_receipt_count
            FROM sales s
            LEFT JOIN stores st ON st.id = s.store_id
            JOIN companies c ON c.id = COALESCE(s.company_id, st.company_id)
            WHERE s.status = 'COMPLETED'
              AND s.created_at >= ? AND s.created_at < ?
            """);
        List<Object> args = new ArrayList<>();
        args.add(ts(period.from()));
        args.add(ts(period.to().plusDays(1)));
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, null, null);
        return jdbc.queryForMap(sql.toString(), args.toArray());
    }

    private static Timestamp ts(LocalDate day) {
        return Timestamp.from(day.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant());
    }
}
