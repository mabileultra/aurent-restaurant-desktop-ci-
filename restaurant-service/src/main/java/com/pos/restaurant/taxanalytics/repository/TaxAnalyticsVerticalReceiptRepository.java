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
import java.util.UUID;

/** Closed floor-order payments exposed as tax-analytics receipts. */
@Repository
@RequiredArgsConstructor
public class TaxAnalyticsVerticalReceiptRepository {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final JdbcTemplate jdbc;

    public Map<String, Object> receiptCounts(int companyId, LocalDate from, LocalDate toExclusive) {
        return jdbc.queryForMap("""
            SELECT 0::bigint AS fiscal_receipt_count,
                   COUNT(*)::bigint AS non_fiscal_receipt_count
            FROM floor_order_payments p
            JOIN floor_orders o ON o.id = p.order_id
            WHERE o.status = 'CLOSED'
              AND o.company_id = ?
              AND p.paid_at >= ? AND p.paid_at < ?
            """, companyId, ts(from), ts(toExclusive));
    }

    public long count(int companyId, LocalDate from, LocalDate toExclusive, String kind) {
        if ("QR".equalsIgnoreCase(kind)) {
            return 0L;
        }
        Long count = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM floor_order_payments p
            JOIN floor_orders o ON o.id = p.order_id
            WHERE o.status = 'CLOSED'
              AND o.company_id = ?
              AND p.paid_at >= ? AND p.paid_at < ?
            """, Long.class, companyId, ts(from), ts(toExclusive));
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
        if ("QR".equalsIgnoreCase(kind)) {
            return List.of();
        }
        return jdbc.queryForList("""
            SELECT o.id::text AS sale_id,
                   ('RST-' || o.order_no)::text AS receipt_number,
                   p.paid_at AS created_at,
                   ('Do‘kon #' || o.store_id)::text AS store_name,
                   p.amount AS total_amount,
                   'NOT_FISCALIZED'::text AS fiscal_status,
                   FALSE AS has_qr,
                   (
                     SELECT COALESCE(SUM(i.quantity), 0)
                     FROM floor_order_items i
                     WHERE i.order_id = o.id
                   ) AS items_quantity
            FROM floor_order_payments p
            JOIN floor_orders o ON o.id = p.order_id
            WHERE o.status = 'CLOSED'
              AND o.company_id = ?
              AND p.paid_at >= ? AND p.paid_at < ?
            ORDER BY p.paid_at DESC
            LIMIT ? OFFSET ?
            """, companyId, ts(from), ts(toExclusive), limit, offset);
    }

    public Map<String, Object> find(int companyId, UUID orderId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT o.id::text AS sale_id,
                   ('RST-' || o.order_no)::text AS receipt_number,
                   p.paid_at AS created_at,
                   ('Do‘kon #' || o.store_id)::text AS store_name,
                   NULL::text AS cashier_name,
                   p.amount AS subtotal,
                   0 AS tax_total,
                   COALESCE(o.discount_amount, 0) AS discount_total,
                   p.amount AS total_amount,
                   p.method AS payment_method,
                   p.cash_amount AS cash_amount,
                   p.card_amount AS card_amount,
                   p.amount_tendered AS amount_tendered,
                   p.change_given AS change_given,
                   o.status AS status,
                   'NOT_FISCALIZED'::text AS fiscal_status,
                   NULL::text AS fiscal_sign,
                   NULL::text AS fiscal_receipt_seq,
                   NULL::text AS fiscal_qr_url,
                   NULL::text AS fiscal_terminal_id,
                   FALSE AS print_fiscal_qr
            FROM floor_order_payments p
            JOIN floor_orders o ON o.id = p.order_id
            WHERE o.status = 'CLOSED'
              AND o.company_id = ?
              AND o.id = ?
            """, companyId, orderId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public List<Map<String, Object>> items(UUID orderId) {
        return jdbc.queryForList("""
            SELECT name AS product_name,
                   quantity,
                   unit_price,
                   ROUND(quantity * unit_price, 2) AS line_total,
                   ROUND(quantity * unit_price * tax_rate / 100.0, 2) AS tax_amount
            FROM floor_order_items
            WHERE order_id = ?
            ORDER BY sort_order, name
            """, orderId);
    }

    public List<Map<String, Object>> topProducts(int companyId, LocalDate from, LocalDate toExclusive, int limit) {
        return jdbc.queryForList("""
            SELECT i.name AS product_name,
                   COALESCE(SUM(i.quantity), 0) AS quantity,
                   COALESCE(SUM(ROUND(i.quantity * i.unit_price, 2)), 0) AS amount
            FROM floor_order_items i
            JOIN floor_orders o ON o.id = i.order_id
            WHERE o.status = 'CLOSED'
              AND o.company_id = ?
              AND EXISTS (
                SELECT 1 FROM floor_order_payments p
                WHERE p.order_id = o.id
                  AND p.paid_at >= ? AND p.paid_at < ?
              )
            GROUP BY i.name
            ORDER BY amount DESC, quantity DESC
            LIMIT ?
            """, companyId, ts(from), ts(toExclusive), limit);
    }

    private static Timestamp ts(LocalDate date) {
        Instant instant = date.atStartOfDay(ZONE).toInstant();
        return Timestamp.from(instant);
    }
}
