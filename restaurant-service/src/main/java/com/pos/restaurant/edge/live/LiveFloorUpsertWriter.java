package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketLineRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderItemModifierRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderItemRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderLinkRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OrderPaymentRow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** JDBC upserts for live floor rows (LWW when forceOverwrite=false). */
@Component
@RequiredArgsConstructor
public class LiveFloorUpsertWriter {

    private final JdbcTemplate jdbc;

    int upsertOrders(EdgeCatalogSnapshot snap, List<OpenOrderRow> rows, boolean forceOverwrite) {
        if (rows == null) return 0;
        Instant now = Instant.now();
        int n = 0;
        for (OpenOrderRow row : rows) {
            if (row.id() == null) continue;
            Instant openedAt = row.openedAt() == null ? now : row.openedAt();
            Instant updatedAt = row.updatedAt() == null ? openedAt : row.updatedAt();
            UUID openedBy = row.openedByUserId() == null ? UUID.randomUUID() : row.openedByUserId();
            // LWW on edge pull: never let stale cloud CLOSED/OPEN clobber a fresher local row.
            jdbc.update("""
                INSERT INTO floor_orders (
                  id, company_id, store_id, table_id, channel, order_no, status,
                  guest_count, adult_count, children_count,
                  client_name, client_phone, delivery_address, delivery_status,
                  opened_by_user_id, waiter_user_id, courier_user_id,
                  commission_percent, commission_base_amount, commission_amount,
                  service_percent, service_amount, discount_amount, shift_id, comment,
                  opened_at, closed_at, updated_at, pickup_no
                ) VALUES (
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id, store_id = EXCLUDED.store_id,
                  table_id = EXCLUDED.table_id, channel = EXCLUDED.channel,
                  order_no = EXCLUDED.order_no, status = EXCLUDED.status,
                  guest_count = EXCLUDED.guest_count, adult_count = EXCLUDED.adult_count,
                  children_count = EXCLUDED.children_count, client_name = EXCLUDED.client_name,
                  client_phone = EXCLUDED.client_phone, delivery_address = EXCLUDED.delivery_address,
                  delivery_status = EXCLUDED.delivery_status, opened_by_user_id = EXCLUDED.opened_by_user_id,
                  waiter_user_id = EXCLUDED.waiter_user_id, courier_user_id = EXCLUDED.courier_user_id,
                  commission_percent = EXCLUDED.commission_percent,
                  commission_base_amount = EXCLUDED.commission_base_amount,
                  commission_amount = EXCLUDED.commission_amount,
                  service_percent = EXCLUDED.service_percent, service_amount = EXCLUDED.service_amount,
                  discount_amount = EXCLUDED.discount_amount, shift_id = EXCLUDED.shift_id,
                  comment = EXCLUDED.comment, opened_at = EXCLUDED.opened_at,
                  closed_at = EXCLUDED.closed_at, updated_at = EXCLUDED.updated_at,
                  pickup_no = EXCLUDED.pickup_no
                WHERE ? OR floor_orders.updated_at IS NULL
                   OR EXCLUDED.updated_at >= floor_orders.updated_at
                """,
                row.id(), snap.companyId(), snap.storeId(), row.tableId(),
                StringUtils.hasText(row.channel()) ? row.channel() : "DINE_IN",
                row.orderNo(),
                StringUtils.hasText(row.status()) ? row.status() : "OPEN",
                row.guestCount(), row.adultCount(), row.childrenCount(),
                row.clientName(), row.clientPhone(), row.deliveryAddress(), row.deliveryStatus(),
                openedBy, row.waiterUserId(), row.courierUserId(),
                row.commissionPercent(), row.commissionBaseAmount(), row.commissionAmount(),
                row.servicePercent(), row.serviceAmount(),
                row.discountAmount() == null ? BigDecimal.ZERO : row.discountAmount(),
                row.shiftId(), row.comment(),
                Timestamp.from(openedAt),
                row.closedAt() == null ? null : Timestamp.from(row.closedAt()),
                Timestamp.from(updatedAt),
                row.pickupNo(),
                forceOverwrite
            );
            n++;
        }
        return n;
    }

    int upsertItems(List<OpenOrderItemRow> rows, boolean forceOverwrite) {
        if (rows == null) return 0;
        Instant now = Instant.now();
        int n = 0;
        for (OpenOrderItemRow row : rows) {
            if (row.id() == null || row.orderId() == null || !StringUtils.hasText(row.name())) continue;
            Instant createdAt = row.createdAt() == null ? now : row.createdAt();
            Instant updatedAt = row.updatedAt() == null ? createdAt : row.updatedAt();
            UUID menuItemId = row.menuItemId();
            if (menuItemId != null) {
                Integer exists = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM menu_items WHERE id = ?", Integer.class, menuItemId
                );
                if (exists == null || exists == 0) menuItemId = null;
            }
            jdbc.update("""
                INSERT INTO floor_order_items (
                  id, order_id, menu_item_id, name, quantity, returned_quantity, sent_quantity,
                  unit_price, tax_rate, station_id, note, item_status, sort_order, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  order_id = EXCLUDED.order_id, menu_item_id = EXCLUDED.menu_item_id,
                  name = EXCLUDED.name, quantity = EXCLUDED.quantity,
                  returned_quantity = EXCLUDED.returned_quantity, sent_quantity = EXCLUDED.sent_quantity,
                  unit_price = EXCLUDED.unit_price, tax_rate = EXCLUDED.tax_rate,
                  station_id = EXCLUDED.station_id, note = EXCLUDED.note,
                  item_status = EXCLUDED.item_status, sort_order = EXCLUDED.sort_order,
                  updated_at = EXCLUDED.updated_at
                WHERE ? OR floor_order_items.updated_at IS NULL
                   OR EXCLUDED.updated_at >= floor_order_items.updated_at
                """,
                row.id(), row.orderId(), menuItemId, row.name().trim(),
                row.quantity() == null ? BigDecimal.ONE : row.quantity(),
                row.returnedQuantity() == null ? BigDecimal.ZERO : row.returnedQuantity(),
                row.sentQuantity() == null ? BigDecimal.ZERO : row.sentQuantity(),
                row.unitPrice() == null ? BigDecimal.ZERO : row.unitPrice(),
                row.taxRate() == null ? BigDecimal.ZERO : row.taxRate(),
                row.stationId(), row.note(),
                StringUtils.hasText(row.itemStatus()) ? row.itemStatus() : "NEW",
                row.sortOrder(), Timestamp.from(createdAt), Timestamp.from(updatedAt),
                forceOverwrite
            );
            n++;
        }
        return n;
    }

    int upsertLinks(List<OpenOrderLinkRow> rows) {
        if (rows == null) return 0;
        Instant now = Instant.now();
        int n = 0;
        for (OpenOrderLinkRow row : rows) {
            if (row.id() == null || row.orderId() == null || row.tableId() == null) continue;
            Instant linkedAt = row.linkedAt() == null ? now : row.linkedAt();
            jdbc.update("DELETE FROM floor_order_table_links WHERE table_id = ? OR id = ?", row.tableId(), row.id());
            jdbc.update("""
                INSERT INTO floor_order_table_links (id, order_id, table_id, linked_at, linked_by_user_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                row.id(), row.orderId(), row.tableId(), Timestamp.from(linkedAt), row.linkedByUserId()
            );
            n++;
        }
        return n;
    }

    int upsertMods(List<OpenOrderItemModifierRow> rows) {
        if (rows == null) return 0;
        int n = 0;
        for (OpenOrderItemModifierRow row : rows) {
            if (row.id() == null || row.orderItemId() == null || !StringUtils.hasText(row.name())) continue;
            Integer ok = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_order_items WHERE id = ?", Integer.class, row.orderItemId()
            );
            if (ok == null || ok == 0) continue;
            jdbc.update("""
                INSERT INTO floor_order_item_modifiers (id, order_item_id, option_id, name, price_delta)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  order_item_id = EXCLUDED.order_item_id, option_id = EXCLUDED.option_id,
                  name = EXCLUDED.name, price_delta = EXCLUDED.price_delta
                """,
                row.id(), row.orderItemId(), row.optionId(), row.name().trim(),
                row.priceDelta() == null ? BigDecimal.ZERO : row.priceDelta()
            );
            n++;
        }
        return n;
    }

    int upsertTickets(EdgeCatalogSnapshot snap, boolean forceOverwrite) {
        List<KitchenTicketRow> rows = snap.kitchenTickets();
        if (rows == null) return 0;
        Instant now = Instant.now();
        int n = 0;
        for (KitchenTicketRow row : rows) {
            if (row.id() == null || row.orderId() == null) continue;
            Integer orderOk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_orders WHERE id = ?", Integer.class, row.orderId()
            );
            if (orderOk == null || orderOk == 0) continue;
            UUID stationId = row.stationId();
            if (stationId != null) {
                Integer st = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM kitchen_stations WHERE id = ?", Integer.class, stationId
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
                  company_id = EXCLUDED.company_id, store_id = EXCLUDED.store_id,
                  order_id = EXCLUDED.order_id, station_id = EXCLUDED.station_id,
                  status = EXCLUDED.status, sent_at = EXCLUDED.sent_at, updated_at = EXCLUDED.updated_at
                WHERE ? OR kitchen_tickets.updated_at IS NULL
                   OR EXCLUDED.updated_at >= kitchen_tickets.updated_at
                """,
                row.id(), snap.companyId(), snap.storeId(), row.orderId(), stationId,
                StringUtils.hasText(row.status()) ? row.status() : "NEW",
                Timestamp.from(sentAt), Timestamp.from(updatedAt),
                forceOverwrite
            );
            n++;
        }
        return n;
    }

    int upsertTicketLines(EdgeCatalogSnapshot snap) {
        List<KitchenTicketLineRow> rows = snap.kitchenTicketLines();
        if (rows == null) return 0;
        int n = 0;
        for (KitchenTicketLineRow row : rows) {
            if (row.id() == null || row.ticketId() == null || row.orderItemId() == null) continue;
            Integer ticketOk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM kitchen_tickets WHERE id = ?", Integer.class, row.ticketId()
            );
            Integer itemOk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_order_items WHERE id = ?", Integer.class, row.orderItemId()
            );
            if (ticketOk == null || ticketOk == 0 || itemOk == null || itemOk == 0) continue;
            jdbc.update("""
                INSERT INTO kitchen_ticket_lines (id, ticket_id, order_item_id, quantity)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  ticket_id = EXCLUDED.ticket_id, order_item_id = EXCLUDED.order_item_id,
                  quantity = EXCLUDED.quantity
                """,
                row.id(), row.ticketId(), row.orderItemId(), row.quantity()
            );
            n++;
        }
        return n;
    }

    int upsertPayments(EdgeCatalogSnapshot snap) {
        if (snap.orderPayments() == null) return 0;
        Instant now = Instant.now();
        int n = 0;
        for (OrderPaymentRow row : snap.orderPayments()) {
            if (row.id() == null || row.orderId() == null) continue;
            Integer orderOk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_orders WHERE id = ?", Integer.class, row.orderId()
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
                  order_id = EXCLUDED.order_id, method = EXCLUDED.method, amount = EXCLUDED.amount,
                  cash_amount = EXCLUDED.cash_amount, card_amount = EXCLUDED.card_amount,
                  amount_tendered = EXCLUDED.amount_tendered, change_given = EXCLUDED.change_given,
                  card_type = EXCLUDED.card_type, debt_phone = EXCLUDED.debt_phone,
                  debt_comment = EXCLUDED.debt_comment, advance_paid = EXCLUDED.advance_paid,
                  debt_remaining = EXCLUDED.debt_remaining, paid_by_user_id = EXCLUDED.paid_by_user_id,
                  paid_at = EXCLUDED.paid_at
                """,
                row.id(), row.orderId(),
                StringUtils.hasText(row.method()) ? row.method() : "CASH",
                row.amount() == null ? BigDecimal.ZERO : row.amount(),
                row.cashAmount() == null ? BigDecimal.ZERO : row.cashAmount(),
                row.cardAmount() == null ? BigDecimal.ZERO : row.cardAmount(),
                row.amountTendered() == null
                    ? (row.amount() == null ? BigDecimal.ZERO : row.amount())
                    : row.amountTendered(),
                row.changeGiven() == null ? BigDecimal.ZERO : row.changeGiven(),
                row.cardType(), row.debtPhone(), row.debtComment(),
                row.advancePaid(), row.debtRemaining(), paidBy, Timestamp.from(paidAt)
            );
            n++;
        }
        return n;
    }

}
