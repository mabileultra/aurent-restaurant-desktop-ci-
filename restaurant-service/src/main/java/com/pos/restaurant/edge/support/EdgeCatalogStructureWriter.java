package com.pos.restaurant.edge.support;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.CategoryRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.HallRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ItemRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.StationRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.TableRow;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.domain.MenuPortionUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * LWW upsert of catalog structure (halls/tables/stations/categories/items).
 * Used by edge bootstrap import and cloud catalog-ingest (hall→cloud S2).
 */
@Component
@RequiredArgsConstructor
public class EdgeCatalogStructureWriter {

    private final JdbcTemplate jdbc;

    @Transactional
    public Map<String, Object> applyStructure(EdgeCatalogSnapshot snap) {
        if (snap == null || snap.companyId() == null || snap.storeId() == null) {
            throw new BusinessException("Invalid catalog snapshot");
        }
        Map<String, Object> out = new HashMap<>();
        out.put("halls", upsertHalls(snap));
        out.put("tables", upsertTables(snap));
        out.put("stations", upsertStations(snap));
        out.put("categories", upsertCategories(snap));
        out.put("items", upsertItems(snap));
        out.put("companyId", snap.companyId());
        out.put("storeId", snap.storeId());
        return out;
    }

    private int upsertHalls(EdgeCatalogSnapshot snap) {
        List<HallRow> rows = snap.halls() == null ? List.of() : snap.halls();
        Instant now = Instant.now();
        int n = 0;
        for (HallRow row : rows) {
            if (row.id() == null) continue;
            jdbc.update("""
                INSERT INTO floor_halls
                  (id, company_id, store_id, name, sort_order, active, service_percent, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id, store_id = EXCLUDED.store_id,
                  name = EXCLUDED.name, sort_order = EXCLUDED.sort_order,
                  active = EXCLUDED.active, service_percent = EXCLUDED.service_percent,
                  updated_at = EXCLUDED.updated_at
                """ + EdgeCatalogLww.whereNotOlderThan("floor_halls"),
                row.id(), snap.companyId(), snap.storeId(), row.name(), row.sortOrder(), row.active(),
                row.servicePercent() == null ? BigDecimal.ZERO : row.servicePercent(),
                EdgeCatalogLww.createdOrNow(row.updatedAt(), now),
                EdgeCatalogLww.bind(row.updatedAt())
            );
            n++;
        }
        return n;
    }

    private int upsertTables(EdgeCatalogSnapshot snap) {
        List<TableRow> rows = snap.tables() == null ? List.of() : snap.tables();
        Instant now = Instant.now();
        int n = 0;
        for (TableRow row : rows) {
            if (row.id() == null || row.hallId() == null) continue;
            String status = StringUtils.hasText(row.status()) ? row.status().trim() : "FREE";
            jdbc.update("""
                INSERT INTO floor_tables
                  (id, hall_id, company_id, store_id, code, label, seat_count, service_percent,
                   pos_x, pos_y, width, height, status, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  hall_id = EXCLUDED.hall_id, company_id = EXCLUDED.company_id, store_id = EXCLUDED.store_id,
                  code = EXCLUDED.code, label = EXCLUDED.label, seat_count = EXCLUDED.seat_count,
                  service_percent = EXCLUDED.service_percent, pos_x = EXCLUDED.pos_x, pos_y = EXCLUDED.pos_y,
                  width = EXCLUDED.width, height = EXCLUDED.height, status = EXCLUDED.status,
                  active = EXCLUDED.active, updated_at = EXCLUDED.updated_at
                """ + EdgeCatalogLww.whereNotOlderThan("floor_tables"),
                row.id(), row.hallId(), snap.companyId(), snap.storeId(), row.code(), row.label(),
                row.seatCount(), row.servicePercent(), row.posX(), row.posY(),
                row.width() <= 0 ? 80 : row.width(), row.height() <= 0 ? 80 : row.height(),
                status, row.active(),
                EdgeCatalogLww.createdOrNow(row.updatedAt(), now),
                EdgeCatalogLww.bind(row.updatedAt())
            );
            n++;
        }
        return n;
    }

    private int upsertStations(EdgeCatalogSnapshot snap) {
        List<StationRow> rows = snap.stations() == null ? List.of() : snap.stations();
        Instant now = Instant.now();
        int n = 0;
        for (StationRow row : rows) {
            if (row.id() == null) continue;
            String code = StringUtils.hasText(row.code()) ? row.code().trim() : ("S" + row.id().toString().substring(0, 8));
            String name = StringUtils.hasText(row.name()) ? row.name().trim() : code;
            jdbc.update("""
                INSERT INTO kitchen_stations
                  (id, company_id, store_id, code, name, sort_order, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id, store_id = EXCLUDED.store_id,
                  code = EXCLUDED.code, name = EXCLUDED.name, sort_order = EXCLUDED.sort_order,
                  active = EXCLUDED.active, updated_at = EXCLUDED.updated_at
                """ + EdgeCatalogLww.whereNotOlderThan("kitchen_stations"),
                row.id(), snap.companyId(), snap.storeId(), code, name, row.sortOrder(), row.active(),
                EdgeCatalogLww.createdOrNow(row.updatedAt(), now),
                EdgeCatalogLww.bind(row.updatedAt())
            );
            n++;
        }
        return n;
    }

    private int upsertCategories(EdgeCatalogSnapshot snap) {
        List<CategoryRow> rows = snap.categories() == null ? List.of() : snap.categories();
        Instant now = Instant.now();
        Set<UUID> known = new HashSet<>();
        for (CategoryRow row : rows) {
            if (row.id() == null) continue;
            writeCategory(
                row.id(), snap.companyId(), snap.storeId(),
                StringUtils.hasText(row.name()) ? row.name().trim() : "Раздел",
                row.sortOrder(), row.active(), row.autoPrint(), row.printPrinterName(),
                now, row.updatedAt()
            );
            known.add(row.id());
        }
        List<ItemRow> items = snap.items() == null ? List.of() : snap.items();
        for (ItemRow item : items) {
            UUID catId = item.menuCategoryId();
            if (catId == null || known.contains(catId)) continue;
            String stubName = StringUtils.hasText(item.category()) ? item.category().trim() : "Раздел";
            writeCategory(catId, snap.companyId(), snap.storeId(), stubName, 900, true, false, null, now, null);
            known.add(catId);
        }
        return known.size();
    }

    private void writeCategory(
        UUID id, Integer companyId, Integer storeId, String name, int sortOrder,
        boolean active, boolean autoPrint, String printPrinterName, Instant now, Instant updatedAt
    ) {
        jdbc.update("""
            INSERT INTO menu_categories
              (id, company_id, store_id, name, sort_order, active, auto_print, print_printer_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              company_id = EXCLUDED.company_id, store_id = EXCLUDED.store_id, name = EXCLUDED.name,
              sort_order = EXCLUDED.sort_order, active = EXCLUDED.active, auto_print = EXCLUDED.auto_print,
              print_printer_name = EXCLUDED.print_printer_name, updated_at = EXCLUDED.updated_at
            """ + EdgeCatalogLww.whereNotOlderThan("menu_categories"),
            id, companyId, storeId, name, sortOrder, active, autoPrint, printPrinterName,
            EdgeCatalogLww.createdOrNow(updatedAt, now),
            EdgeCatalogLww.bind(updatedAt)
        );
    }

    private int upsertItems(EdgeCatalogSnapshot snap) {
        List<ItemRow> rows = snap.items() == null ? List.of() : snap.items();
        Instant now = Instant.now();
        Set<UUID> stationIds = new HashSet<>();
        if (snap.stations() != null) {
            for (StationRow s : snap.stations()) {
                if (s != null && s.id() != null) stationIds.add(s.id());
            }
        }
        int n = 0;
        for (ItemRow row : rows) {
            if (row.id() == null || !StringUtils.hasText(row.name())) continue;
            UUID stationId = row.stationId() != null && stationIds.contains(row.stationId())
                ? row.stationId() : null;
            String itemType = parseEnum(MenuItemType.class, row.itemType(), MenuItemType.DISH).name();
            MenuPortionUnit portionUnit = parseEnum(MenuPortionUnit.class, row.portionUnit(), null);
            jdbc.update("""
                INSERT INTO menu_items (
                  id, company_id, store_id, item_type, name, sku, price, tax_rate, active, available,
                  station_id, category, menu_category_id, image_url, description, prep_minutes,
                  portion_grams, portion_amount, portion_unit, portion_label, variant_group_id, tags,
                  ikpu, package_code, unit_of_measure, unit_measure_code, barcode, marked_product,
                  sort_order, created_at, updated_at
                ) VALUES (
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
                ON CONFLICT (id) DO UPDATE SET
                  company_id = EXCLUDED.company_id, store_id = EXCLUDED.store_id, item_type = EXCLUDED.item_type,
                  name = EXCLUDED.name, sku = EXCLUDED.sku, price = EXCLUDED.price, tax_rate = EXCLUDED.tax_rate,
                  active = EXCLUDED.active, available = EXCLUDED.available, station_id = EXCLUDED.station_id,
                  category = EXCLUDED.category, menu_category_id = EXCLUDED.menu_category_id,
                  image_url = EXCLUDED.image_url, description = EXCLUDED.description,
                  prep_minutes = EXCLUDED.prep_minutes, portion_grams = EXCLUDED.portion_grams,
                  portion_amount = EXCLUDED.portion_amount, portion_unit = EXCLUDED.portion_unit,
                  portion_label = EXCLUDED.portion_label, variant_group_id = EXCLUDED.variant_group_id,
                  tags = EXCLUDED.tags, ikpu = EXCLUDED.ikpu, package_code = EXCLUDED.package_code,
                  unit_of_measure = EXCLUDED.unit_of_measure, unit_measure_code = EXCLUDED.unit_measure_code,
                  barcode = EXCLUDED.barcode, marked_product = EXCLUDED.marked_product,
                  sort_order = EXCLUDED.sort_order, updated_at = EXCLUDED.updated_at
                """ + EdgeCatalogLww.whereNotOlderThan("menu_items"),
                row.id(), snap.companyId(), snap.storeId(), itemType, row.name().trim(), row.sku(),
                row.price() == null ? BigDecimal.ZERO : row.price(),
                row.taxRate() == null ? BigDecimal.ZERO : row.taxRate(),
                row.active(), row.available(), stationId, row.category(), row.menuCategoryId(),
                row.imageUrl(), row.description(), row.prepMinutes(), row.portionGrams(), row.portionAmount(),
                portionUnit == null ? null : portionUnit.name(), row.portionLabel(), row.variantGroupId(),
                row.tags(), row.ikpu(), row.packageCode(), row.unitOfMeasure(), row.unitMeasureCode(),
                row.barcode(), row.markedProduct(), row.sortOrder(),
                EdgeCatalogLww.createdOrNow(row.updatedAt(), now),
                EdgeCatalogLww.bind(row.updatedAt())
            );
            n++;
        }
        return n;
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> type, String raw, E fallback) {
        if (!StringUtils.hasText(raw)) return fallback;
        try {
            return Enum.valueOf(type, raw.trim());
        } catch (Exception ex) {
            return fallback;
        }
    }
}
