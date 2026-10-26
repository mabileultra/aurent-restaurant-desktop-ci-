package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketLineRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderItemModifierRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderItemRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderLinkRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OrderPaymentRow;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.revision.FloorRevisionBump;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

/**
 * Apply live floor slice (orders / kitchen / payments) — used by edge import and cloud live-ingest.
 * Always available (not gated by edge.enabled).
 */
@Service
@RequiredArgsConstructor
public class LiveFloorApplyService {

    private final JdbcTemplate jdbc;
    private final LiveServicePercentApply servicePercentApply;
    private final FloorRevisionBump floorRevision;

    @Transactional
    public Map<String, Object> applyLive(EdgeCatalogSnapshot snap) {
        return applyLive(snap, true);
    }

    /**
     * @param reconcileGhosts when true, OPEN/BILLING rows absent from the snapshot are closed
     *                        (cloud ingest from hall). When false, upsert-only — edge pull from
     *                        cloud must not wipe hall-local tables that are not on cloud yet.
     */
    @Transactional
    public Map<String, Object> applyLive(EdgeCatalogSnapshot snap, boolean reconcileGhosts) {
        if (snap == null || snap.companyId() == null || snap.storeId() == null) {
            throw new BusinessException("Invalid live snapshot");
        }
        // Edge pull only. Cloud ingest must not let a hall PC overwrite the admin percent.
        int servicePercents = reconcileGhosts ? 0 : servicePercentApply.apply(snap);
        int orders = upsertOrders(snap, snap.openOrders());
        int items = upsertItems(snap.openOrderItems());
        int links = upsertLinks(snap.openOrderLinks());
        int mods = upsertMods(snap.openOrderItemModifiers());
        int tickets = upsertTickets(snap);
        int ticketLines = upsertTicketLines(snap);
        int payments = upsertPayments(snap);
        int closedGhosts = reconcileGhosts ? reconcileOpen(snap) : 0;
        int staleTickets = reconcileGhosts ? reconcileTickets(snap) : 0;
        floorRevision.noteRemote(snap.companyId(), snap.storeId(), snap.floorRevision());

        Map<String, Object> out = new HashMap<>();
        out.put("servicePercents", servicePercents);
        out.put("openOrders", orders);
        out.put("openOrderItems", items);
        out.put("openOrderLinks", links);
        out.put("openOrderItemModifiers", mods);
        out.put("kitchenTickets", tickets);
        out.put("kitchenTicketLines", ticketLines);
        out.put("orderPayments", payments);
        out.put("closedGhostOrders", closedGhosts);
        out.put("cancelledStaleTickets", staleTickets);
        out.put("companyId", snap.companyId());
        out.put("storeId", snap.storeId());
        out.put("reconcileGhosts", reconcileGhosts);
        return out;
    }

    private int upsertOrders(EdgeCatalogSnapshot snap, List<OpenOrderRow> rows) {
        if (rows == null) return 0;
        Instant now = Instant.now();
        int n = 0;
        for (OpenOrderRow row : rows) {
            if (row.id() == null) continue;
            Instant openedAt = row.openedAt() == null ? now : row.openedAt();
            Instant updatedAt = row.updatedAt() == null ? openedAt : row.updatedAt();
            UUID openedBy = row.openedByUserId() == null ? UUID.randomUUID() : row.openedByUserId();
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
                row.pickupNo()
            );
            n++;
        }
        return n;
    }

    private int upsertItems(List<OpenOrderItemRow> rows) {
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
                """,
                row.id(), row.orderId(), menuItemId, row.name().trim(),
                row.quantity() == null ? BigDecimal.ONE : row.quantity(),
                row.returnedQuantity() == null ? BigDecimal.ZERO : row.returnedQuantity(),
                row.sentQuantity() == null ? BigDecimal.ZERO : row.sentQuantity(),
                row.unitPrice() == null ? BigDecimal.ZERO : row.unitPrice(),
                row.taxRate() == null ? BigDecimal.ZERO : row.taxRate(),
                row.stationId(), row.note(),
                StringUtils.hasText(row.itemStatus()) ? row.itemStatus() : "NEW",
                row.sortOrder(), Timestamp.from(createdAt), Timestamp.from(updatedAt)
            );
            n++;
        }
        return n;
    }

    private int upsertLinks(List<OpenOrderLinkRow> rows) {
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

    private int upsertMods(List<OpenOrderItemModifierRow> rows) {
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

    private int upsertTickets(EdgeCatalogSnapshot snap) {
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
                """,
                row.id(), snap.companyId(), snap.storeId(), row.orderId(), stationId,
                StringUtils.hasText(row.status()) ? row.status() : "NEW",
                Timestamp.from(sentAt), Timestamp.from(updatedAt)
            );
            n++;
        }
        return n;
    }

    private int upsertTicketLines(EdgeCatalogSnapshot snap) {
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

    private int upsertPayments(EdgeCatalogSnapshot snap) {
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

    private int reconcileOpen(EdgeCatalogSnapshot snap) {
        // null = field omitted (partial payload) — never mass-close.
        // empty list = deliberate empty floor from hall push — close leftovers.
        if (snap.openOrders() == null) return 0;
        Set<UUID> keep = new HashSet<>();
        for (OpenOrderRow row : snap.openOrders()) {
            if (row.id() != null) keep.add(row.id());
        }
        Instant now = Instant.now();
        if (keep.isEmpty()) {
            return jdbc.update("""
                UPDATE floor_orders
                SET status = 'CLOSED', closed_at = COALESCE(closed_at, ?), updated_at = ?
                WHERE company_id = ? AND store_id = ? AND status IN ('OPEN', 'BILLING')
                """,
                Timestamp.from(now), Timestamp.from(now), snap.companyId(), snap.storeId()
            );
        }
        String placeholders = String.join(",", keep.stream().map(id -> "?").toList());
        Object[] args = new Object[keep.size() + 4];
        int i = 0;
        args[i++] = Timestamp.from(now);
        args[i++] = Timestamp.from(now);
        args[i++] = snap.companyId();
        args[i++] = snap.storeId();
        for (UUID id : keep) args[i++] = id;
        return jdbc.update("""
            UPDATE floor_orders
            SET status = 'CLOSED', closed_at = COALESCE(closed_at, ?), updated_at = ?
            WHERE company_id = ? AND store_id = ? AND status IN ('OPEN', 'BILLING')
              AND id NOT IN (%s)
            """.formatted(placeholders), args);
    }

    private int reconcileTickets(EdgeCatalogSnapshot snap) {
        if (snap.kitchenTickets() == null) return 0;
        Set<UUID> keep = new HashSet<>();
        for (KitchenTicketRow row : snap.kitchenTickets()) {
            if (row.id() != null) keep.add(row.id());
        }
        Instant now = Instant.now();
        if (keep.isEmpty()) {
            return jdbc.update("""
                UPDATE kitchen_tickets SET status = 'CANCELLED', updated_at = ?
                WHERE company_id = ? AND store_id = ? AND status NOT IN ('SERVED', 'CANCELLED')
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
            UPDATE kitchen_tickets SET status = 'CANCELLED', updated_at = ?
            WHERE company_id = ? AND store_id = ? AND status NOT IN ('SERVED', 'CANCELLED')
              AND id NOT IN (%s)
            """.formatted(placeholders), args);
    }
}
