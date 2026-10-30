package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsWeekWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsReceiptQueryRepository {

    private static final String COMPANY =
        "COALESCE(s.company_id, st.company_id) = ? AND s.status = 'COMPLETED' ";

    private final JdbcTemplate jdbcTemplate;

    public long count(int companyId, LocalDate day, String kind) {
        return jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sales s LEFT JOIN stores st ON st.id = s.store_id WHERE " + COMPANY + kindSql(kind)
                + " AND s.created_at >= ? AND s.created_at < ?",
            Long.class,
            companyId, start(day), end(day)
        );
    }

    public List<Map<String, Object>> list(int companyId, LocalDate day, String kind, int limit, int offset) {
        return jdbcTemplate.queryForList(
            """
                SELECT s.id::text AS sale_id, s.receipt_number, s.created_at, st.name AS store_name,
                       s.total_amount, s.fiscal_status,
                       NULLIF(BTRIM(s.fiscal_qr_url), '') IS NOT NULL AS has_qr
                FROM sales s
                LEFT JOIN stores st ON st.id = s.store_id
                WHERE
                """ + COMPANY + kindSql(kind) + """
                 AND s.created_at >= ? AND s.created_at < ?
                ORDER BY s.created_at DESC
                LIMIT ? OFFSET ?
                """,
            companyId, start(day), end(day), limit, offset
        );
    }

    public Map<String, Object> find(int companyId, UUID saleId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            """
                SELECT s.id::text AS sale_id, s.receipt_number, s.created_at, st.name AS store_name,
                       u.full_name AS cashier_name, s.subtotal, s.tax_total, s.discount_total, s.total_amount,
                       s.payment_method, s.cash_amount, s.card_amount, s.amount_tendered, s.change_given,
                       s.status, s.fiscal_status, s.fiscal_sign, s.fiscal_receipt_seq, s.fiscal_qr_url,
                       s.fiscal_terminal_id, COALESCE(s.print_fiscal_qr, TRUE) AS print_fiscal_qr
                FROM sales s
                LEFT JOIN stores st ON st.id = s.store_id
                LEFT JOIN users u ON u.id = s.cashier_id
                WHERE s.id = ? AND
                """ + COMPANY,
            saleId, companyId
        );
        return rows.isEmpty() ? null : rows.get(0);
    }

    public List<Map<String, Object>> items(UUID saleId) {
        return jdbcTemplate.queryForList(
            """
                SELECT product_name, quantity, unit_price, line_total, tax_amount
                FROM sale_items
                WHERE sale_id = ?
                ORDER BY product_name
                """,
            saleId
        );
    }

    private static String kindSql(String kind) {
        if ("QR".equalsIgnoreCase(kind)) {
            return " AND NULLIF(BTRIM(s.fiscal_qr_url), '') IS NOT NULL ";
        }
        if ("NO_QR".equalsIgnoreCase(kind)) {
            return " AND NULLIF(BTRIM(s.fiscal_qr_url), '') IS NULL ";
        }
        return "";
    }

    private static Timestamp start(LocalDate day) {
        return Timestamp.from(day.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant());
    }

    private static Timestamp end(LocalDate day) {
        return Timestamp.from(day.plusDays(1).atTime(LocalTime.MIN).atZone(TaxAnalyticsWeekWindow.ZONE).toInstant());
    }
}
