package com.pos.restaurant.edge.support;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderItemModifierRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderItemRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderLinkRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderRow;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Open + closed floor orders for catalog bootstrap. */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCatalogOrderBootstrapWriter {

    private final JdbcTemplate jdbc;

    public Map<String, Object> apply(EdgeCatalogSnapshot snap) {
        Map<String, Object> out = new HashMap<>();
        out.put("openOrders", upsertOpenOrders(snap));
        out.put("openOrderItems", upsertOpenOrderItems(snap));
        out.put("openOrderLinks", upsertOpenOrderLinks(snap));
        out.put("openOrderItemModifiers", upsertOpenOrderItemModifiers(snap));
        out.put("closedOrders", upsertClosedOrders(snap));
        out.put("closedOrderItems", upsertClosedOrderItems(snap));
        out.put("closedOrderItemModifiers", upsertClosedOrderItemModifiers(snap));
        return out;
    }

    public int upsertClosedOrders(EdgeCatalogSnapshot snap) {
        if (snap.closedOrders() == null) return 0;
        return upsertOrderRows(snap, snap.closedOrders());
    }

    public int upsertClosedOrderItems(EdgeCatalogSnapshot snap) {
        if (snap.closedOrderItems() == null) return 0;
        return upsertOrderItemRows(snap.closedOrderItems());
    }

    public int upsertClosedOrderItemModifiers(EdgeCatalogSnapshot snap) {
        if (snap.closedOrderItemModifiers() == null) return 0;
        return upsertOrderItemModifierRows(snap.closedOrderItemModifiers());
    }

    public int upsertOpenOrders(EdgeCatalogSnapshot snap) {
        List<OpenOrderRow> rows = snap.openOrders() == null ? List.of() : snap.openOrders();
        return upsertOrderRows(snap, rows);
    }

    public int upsertOrderRows(EdgeCatalogSnapshot snap, List<OpenOrderRow> rows) {
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
                  ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?,
                  ?, ?, ?, ?,
                  ?, ?, ?,
                  ?, ?, ?,
                  ?, ?, ?, ?, ?,
                  ?, ?, ?, ?
                )
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id,
                  store_id = EXCLUDED.store_id,
                  table_id = EXCLUDED.table_id,
                  channel = EXCLUDED.channel,
                  order_no = EXCLUDED.order_no,
                  status = EXCLUDED.status,
                  guest_count = EXCLUDED.guest_count,
                  adult_count = EXCLUDED.adult_count,
                  children_count = EXCLUDED.children_count,
                  client_name = EXCLUDED.client_name,
                  client_phone = EXCLUDED.client_phone,
                  delivery_address = EXCLUDED.delivery_address,
                  delivery_status = EXCLUDED.delivery_status,
                  opened_by_user_id = EXCLUDED.opened_by_user_id,
                  waiter_user_id = EXCLUDED.waiter_user_id,
                  courier_user_id = EXCLUDED.courier_user_id,
                  commission_percent = EXCLUDED.commission_percent,
                  commission_base_amount = EXCLUDED.commission_base_amount,
                  commission_amount = EXCLUDED.commission_amount,
                  service_percent = EXCLUDED.service_percent,
                  service_amount = EXCLUDED.service_amount,
                  discount_amount = EXCLUDED.discount_amount,
                  shift_id = EXCLUDED.shift_id,
                  comment = EXCLUDED.comment,
                  opened_at = EXCLUDED.opened_at,
                  closed_at = EXCLUDED.closed_at,
                  updated_at = EXCLUDED.updated_at,
                  pickup_no = EXCLUDED.pickup_no
                """,
                row.id(),
                snap.companyId(),
                snap.storeId(),
                row.tableId(),
                StringUtils.hasText(row.channel()) ? row.channel() : "DINE_IN",
                row.orderNo(),
                StringUtils.hasText(row.status()) ? row.status() : "OPEN",
                row.guestCount(),
                row.adultCount(),
                row.childrenCount(),
                row.clientName(),
                row.clientPhone(),
                row.deliveryAddress(),
                row.deliveryStatus(),
                openedBy,
                row.waiterUserId(),
                row.courierUserId(),
                row.commissionPercent(),
                row.commissionBaseAmount(),
                row.commissionAmount(),
                row.servicePercent(),
                row.serviceAmount(),
                row.discountAmount() == null ? BigDecimal.ZERO : row.discountAmount(),
                row.shiftId(),
                row.comment(),
                Timestamp.from(openedAt),
                row.closedAt() == null ? null : Timestamp.from(row.closedAt()),
                Timestamp.from(updatedAt),
                row.pickupNo()
            );
            n++;
        }
        return n;
    }

    public int upsertOpenOrderItems(EdgeCatalogSnapshot snap) {
        List<OpenOrderItemRow> rows = snap.openOrderItems() == null ? List.of() : snap.openOrderItems();
        return upsertOrderItemRows(rows);
    }

    public int upsertOrderItemRows(List<OpenOrderItemRow> rows) {
        Instant now = Instant.now();
        int n = 0;
        for (OpenOrderItemRow row : rows) {
            if (row.id() == null || row.orderId() == null || !StringUtils.hasText(row.name())) continue;
            Instant createdAt = row.createdAt() == null ? now : row.createdAt();
            Instant updatedAt = row.updatedAt() == null ? createdAt : row.updatedAt();
            // Drop menu_item FK if dish missing locally (still show line by name).
            UUID menuItemId = row.menuItemId();
            if (menuItemId != null) {
                Integer exists = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM menu_items WHERE id = ?",
                    Integer.class,
                    menuItemId
                );
                if (exists == null || exists == 0) menuItemId = null;
            }
            jdbc.update("""
                INSERT INTO floor_order_items (
                  id, order_id, menu_item_id, name, quantity, returned_quantity, sent_quantity,
                  unit_price, tax_rate, station_id, note, item_status, sort_order, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  order_id = EXCLUDED.order_id,
                  menu_item_id = EXCLUDED.menu_item_id,
                  name = EXCLUDED.name,
                  quantity = EXCLUDED.quantity,
                  returned_quantity = EXCLUDED.returned_quantity,
                  sent_quantity = EXCLUDED.sent_quantity,
                  unit_price = EXCLUDED.unit_price,
                  tax_rate = EXCLUDED.tax_rate,
                  station_id = EXCLUDED.station_id,
                  note = EXCLUDED.note,
                  item_status = EXCLUDED.item_status,
                  sort_order = EXCLUDED.sort_order,
                  updated_at = EXCLUDED.updated_at
                """,
                row.id(),
                row.orderId(),
                menuItemId,
                row.name().trim(),
                row.quantity() == null ? BigDecimal.ONE : row.quantity(),
                row.returnedQuantity() == null ? BigDecimal.ZERO : row.returnedQuantity(),
                row.sentQuantity() == null ? BigDecimal.ZERO : row.sentQuantity(),
                row.unitPrice() == null ? BigDecimal.ZERO : row.unitPrice(),
                row.taxRate() == null ? BigDecimal.ZERO : row.taxRate(),
                row.stationId(),
                row.note(),
                StringUtils.hasText(row.itemStatus()) ? row.itemStatus() : "NEW",
                row.sortOrder(),
                Timestamp.from(createdAt),
                Timestamp.from(updatedAt)
            );
            n++;
        }
        return n;
    }

    public int upsertOpenOrderLinks(EdgeCatalogSnapshot snap) {
        List<OpenOrderLinkRow> rows = snap.openOrderLinks() == null ? List.of() : snap.openOrderLinks();
        Instant now = Instant.now();
        int n = 0;
        for (OpenOrderLinkRow row : rows) {
            if (row.id() == null || row.orderId() == null || row.tableId() == null) continue;
            Instant linkedAt = row.linkedAt() == null ? now : row.linkedAt();
            // Unique on table_id — clear stale link before upsert.
            jdbc.update("DELETE FROM floor_order_table_links WHERE table_id = ? OR id = ?", row.tableId(), row.id());
            jdbc.update("""
                INSERT INTO floor_order_table_links (id, order_id, table_id, linked_at, linked_by_user_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                row.id(),
                row.orderId(),
                row.tableId(),
                Timestamp.from(linkedAt),
                row.linkedByUserId()
            );
            n++;
        }
        return n;
    }

    public int upsertOpenOrderItemModifiers(EdgeCatalogSnapshot snap) {
        List<OpenOrderItemModifierRow> rows =
            snap.openOrderItemModifiers() == null ? List.of() : snap.openOrderItemModifiers();
        return upsertOrderItemModifierRows(rows);
    }

    public int upsertOrderItemModifierRows(List<OpenOrderItemModifierRow> rows) {
        int n = 0;
        for (OpenOrderItemModifierRow row : rows) {
            if (row.id() == null || row.orderItemId() == null || !StringUtils.hasText(row.name())) continue;
            Integer itemExists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM floor_order_items WHERE id = ?",
                Integer.class,
                row.orderItemId()
            );
            if (itemExists == null || itemExists == 0) continue;
            jdbc.update("""
                INSERT INTO floor_order_item_modifiers (id, order_item_id, option_id, name, price_delta)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  order_item_id = EXCLUDED.order_item_id,
                  option_id = EXCLUDED.option_id,
                  name = EXCLUDED.name,
                  price_delta = EXCLUDED.price_delta
                """,
                row.id(),
                row.orderItemId(),
                row.optionId(),
                row.name().trim(),
                row.priceDelta() == null ? BigDecimal.ZERO : row.priceDelta()
            );
            n++;
        }
        return n;
    }
}
