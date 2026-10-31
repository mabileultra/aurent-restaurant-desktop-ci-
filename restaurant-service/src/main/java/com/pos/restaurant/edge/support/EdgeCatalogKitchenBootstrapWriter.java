package com.pos.restaurant.edge.support;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketLineRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OrderPaymentRow;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Kitchen tickets + payments for catalog bootstrap. */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCatalogKitchenBootstrapWriter {

    private final JdbcTemplate jdbc;

    public Map<String, Object> apply(EdgeCatalogSnapshot snap) {
        Map<String, Object> out = new HashMap<>();
        out.put("kitchenTickets", upsertKitchenTickets(snap));
        out.put("kitchenTicketLines", upsertKitchenTicketLines(snap));
        out.put("cancelledStaleTickets", reconcileStaleKitchenTickets(snap));
        out.put("orderPayments", upsertOrderPayments(snap));
        return out;
    }

    public int upsertKitchenTickets(EdgeCatalogSnapshot snap) {
        List<KitchenTicketRow> rows = snap.kitchenTickets() == null ? List.of() : snap.kitchenTickets();
        Instant now = Instant.now();
        int n = 0;
        for (KitchenTicketRow row : rows) {
            if (row.id() == null || row.orderId() == null) continue;
            Integer orderExists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_orders WHERE id = ?",
                Integer.class,
                row.orderId()
            );
            if (orderExists == null || orderExists == 0) continue;
            UUID stationId = row.stationId();
            if (stationId != null) {
                Integer st = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM kitchen_stations WHERE id = ?",
                    Integer.class,
                    stationId
                );
                if (st == null || st == 0) stationId = null;
            }
            Instant sentAt = row.sentAt() == null ? now : row.sentAt();
            Instant updatedAt = row.updatedAt() == null ? sentAt : row.updatedAt();
            jdbc.update("""
                INSERT INTO kitchen_tickets (
                  id, company_id, store_id, order_id, station_id, status, sent_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  store_id = EXCLUDED.store_id,
                  order_id = EXCLUDED.order_id,
                  station_id = EXCLUDED.station_id,
                  status = EXCLUDED.status,
                  sent_at = EXCLUDED.sent_at,
                  updated_at = EXCLUDED.updated_at
                """,
                row.id(),
                snap.companyId(),
                snap.storeId(),
                row.orderId(),
                stationId,
                StringUtils.hasText(row.status()) ? row.status() : "NEW",
                Timestamp.from(sentAt),
                Timestamp.from(updatedAt)
            );
            n++;
        }
        return n;
    }

    public int upsertKitchenTicketLines(EdgeCatalogSnapshot snap) {
        List<KitchenTicketLineRow> rows =
            snap.kitchenTicketLines() == null ? List.of() : snap.kitchenTicketLines();
        int n = 0;
        for (KitchenTicketLineRow row : rows) {
            if (row.id() == null || row.ticketId() == null || row.orderItemId() == null) continue;
            Integer ticketOk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM kitchen_tickets WHERE id = ?",
                Integer.class,
                row.ticketId()
            );
            Integer itemOk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_order_items WHERE id = ?",
                Integer.class,
                row.orderItemId()
            );
            if (ticketOk == null || ticketOk == 0 || itemOk == null || itemOk == 0) continue;
            jdbc.update("""
                INSERT INTO kitchen_ticket_lines (id, ticket_id, order_item_id, quantity)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  ticket_id = EXCLUDED.ticket_id,
                  order_item_id = EXCLUDED.order_item_id,
                  quantity = EXCLUDED.quantity
                """,
                row.id(),
                row.ticketId(),
                row.orderItemId(),
                row.quantity()
            );
            n++;
        }
        return n;
    }

    public int upsertOrderPayments(EdgeCatalogSnapshot snap) {
        if (snap.orderPayments() == null) return 0;
        List<OrderPaymentRow> rows = snap.orderPayments();
        Instant now = Instant.now();
        int n = 0;
        for (OrderPaymentRow row : rows) {
            if (row.id() == null || row.orderId() == null) continue;
            Integer orderOk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_orders WHERE id = ?",
                Integer.class,
                row.orderId()
            );
            if (orderOk == null || orderOk == 0) continue;
            Instant paidAt = row.paidAt() == null ? now : row.paidAt();
            UUID paidBy = row.paidByUserId() == null ? UUID.randomUUID() : row.paidByUserId();
            jdbc.update("""
                INSERT INTO floor_order_payments (
                  id, order_id, method, amount, cash_amount, card_amount,
                  amount_tendered, change_given, card_type,
                  debt_phone, debt_comment, advance_paid, debt_remaining,
                  paid_by_user_id, paid_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  order_id = EXCLUDED.order_id,
                  method = EXCLUDED.method,
                  amount = EXCLUDED.amount,
                  cash_amount = EXCLUDED.cash_amount,
                  card_amount = EXCLUDED.card_amount,
                  amount_tendered = EXCLUDED.amount_tendered,
                  change_given = EXCLUDED.change_given,
                  card_type = EXCLUDED.card_type,
                  debt_phone = EXCLUDED.debt_phone,
                  debt_comment = EXCLUDED.debt_comment,
                  advance_paid = EXCLUDED.advance_paid,
                  debt_remaining = EXCLUDED.debt_remaining,
                  paid_by_user_id = EXCLUDED.paid_by_user_id,
                  paid_at = EXCLUDED.paid_at
                """,
                row.id(),
                row.orderId(),
                StringUtils.hasText(row.method()) ? row.method() : "CASH",
                row.amount() == null ? BigDecimal.ZERO : row.amount(),
                row.cashAmount() == null ? BigDecimal.ZERO : row.cashAmount(),
                row.cardAmount() == null ? BigDecimal.ZERO : row.cardAmount(),
                row.amountTendered() == null
                    ? (row.amount() == null ? BigDecimal.ZERO : row.amount())
                    : row.amountTendered(),
                row.changeGiven() == null ? BigDecimal.ZERO : row.changeGiven(),
                row.cardType(),
                row.debtPhone(),
                row.debtComment(),
                row.advancePaid(),
                row.debtRemaining(),
                paidBy,
                Timestamp.from(paidAt)
            );
            n++;
        }
        return n;
    }

    public int reconcileStaleKitchenTickets(EdgeCatalogSnapshot snap) {
        if (snap.kitchenTickets() == null) return 0;
        List<KitchenTicketRow> rows = snap.kitchenTickets();
        Set<UUID> keep = new HashSet<>();
        for (KitchenTicketRow row : rows) {
            if (row.id() != null) keep.add(row.id());
        }
        Instant now = Instant.now();
        if (keep.isEmpty()) {
            return jdbc.update("""
                UPDATE kitchen_tickets
                SET status = 'CANCELLED', updated_at = ?
                WHERE company_id = ? AND store_id = ?
                  AND status NOT IN ('SERVED', 'CANCELLED')
                """,
                Timestamp.from(now), snap.companyId(), snap.storeId()
            );
        }
        String placeholders = String.join(",", keep.stream().map(id -> "?").toList());
        Object[] args = new Object[keep.size() + 3];
        int i = 0;
        args[i++] = Timestamp.from(now);
        args[i++] = snap.companyId();
        args[i++] = snap.storeId();
        for (UUID id : keep) args[i++] = id;
        return jdbc.update("""
            UPDATE kitchen_tickets
            SET status = 'CANCELLED', updated_at = ?
            WHERE company_id = ? AND store_id = ?
              AND status NOT IN ('SERVED', 'CANCELLED')
              AND id NOT IN (%s)
            """.formatted(placeholders),
            args
        );
    }



}
