package com.pos.pharmacy.taxanalytics.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsVerticalReceiptRepository {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final JdbcTemplate jdbc;

    public Map<String, Object> receiptCounts(int companyId, LocalDate from, LocalDate toExclusive) {
        return jdbc.queryForMap("""
            SELECT COALESCE(SUM(CASE WHEN fiscal_status = 'FISCALIZED' THEN 1 ELSE 0 END), 0)::bigint AS fiscal_receipt_count,
                   COALESCE(SUM(CASE WHEN fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN 1 ELSE 0 END), 0)::bigint AS non_fiscal_receipt_count
            FROM sales
            WHERE status = 'COMPLETED'
              AND company_id = ?
              AND created_at >= ? AND created_at < ?
            """, companyId, ts(from), ts(toExclusive));
    }

    public long count(int companyId, LocalDate from, LocalDate toExclusive, String kind) {
        Long count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM sales WHERE status = 'COMPLETED' AND company_id = ? AND created_at >= ? AND created_at < ?"
                + kindSql(kind),
            Long.class,
            companyId, ts(from), ts(toExclusive)
        );
        return count == null ? 0L : count;
    }

    public List<Map<String, Object>> list(
        int companyId,
        LocalDate from,
        LocalDate toExclusive,
        String kind,
        int limit,
        int offset
    ) {
        return jdbc.queryForList(
            """
                SELECT id::text AS sale_id,
                       receipt_number,
                       created_at,
                       ('Do‘kon #' || store_id)::text AS store_name,
                       total_amount,
                       fiscal_status,
                       NULLIF(BTRIM(fiscal_qr_url), '') IS NOT NULL AS has_qr
                FROM sales
                WHERE status = 'COMPLETED'
                  AND company_id = ?
                  AND created_at >= ? AND created_at < ?
                """ + kindSql(kind) + """
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """,
            companyId, ts(from), ts(toExclusive), limit, offset
        );
    }

    public Map<String, Object> find(int companyId, UUID saleId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT id::text AS sale_id,
                   receipt_number,
                   created_at,
                   ('Do‘kon #' || store_id)::text AS store_name,
                   cashier_name,
                   subtotal,
                   tax_total,
                   discount_total,
                   total_amount,
                   payment_method,
                   cash_amount,
                   card_amount,
                   amount_tendered,
                   change_given,
                   status,
                   fiscal_status,
                   fiscal_sign,
                   fiscal_receipt_seq,
                   fiscal_qr_url,
                   fiscal_terminal_id,
                   print_fiscal_qr
            FROM sales
            WHERE status = 'COMPLETED'
              AND company_id = ?
              AND id = ?
            """, companyId, saleId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public List<Map<String, Object>> items(UUID saleId) {
        return jdbc.queryForList("""
            SELECT product_name, quantity, unit_price, line_total, tax_amount
            FROM sale_items
            WHERE sale_id = ?
            ORDER BY product_name
            """, saleId);
    }

    public List<Map<String, Object>> topProducts(int companyId, LocalDate from, LocalDate toExclusive, int limit) {
        return jdbc.queryForList("""
            SELECT si.product_name AS product_name,
                   COALESCE(SUM(si.quantity - COALESCE(si.returned_quantity, 0)), 0) AS quantity,
                   COALESCE(SUM(si.line_total), 0) AS amount
            FROM sale_items si
            JOIN sales s ON s.id = si.sale_id
            WHERE s.status = 'COMPLETED'
              AND s.company_id = ?
              AND s.created_at >= ? AND s.created_at < ?
            GROUP BY si.product_name
            ORDER BY amount DESC, quantity DESC
            LIMIT ?
            """, companyId, ts(from), ts(toExclusive), limit);
    }

    private static String kindSql(String kind) {
        if ("QR".equalsIgnoreCase(kind)) {
            return " AND NULLIF(BTRIM(fiscal_qr_url), '') IS NOT NULL ";
        }
        if ("NO_QR".equalsIgnoreCase(kind)) {
            return " AND NULLIF(BTRIM(fiscal_qr_url), '') IS NULL ";
        }
        return "";
    }

    private static Timestamp ts(LocalDate date) {
        Instant instant = date.atStartOfDay(ZONE).toInstant();
        return Timestamp.from(instant);
    }
}
