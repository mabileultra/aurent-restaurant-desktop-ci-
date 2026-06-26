package com.pos.reporting.export.mapper;

import com.pos.reporting.dto.stock.pos.PosDeadStockRow;
import com.pos.reporting.dto.stock.pos.PosStockBalanceRow;
import com.pos.reporting.dto.stock.pos.PosStockInventoryRow;
import com.pos.reporting.dto.stock.pos.PosStockMovementRow;
import com.pos.reporting.dto.stock.pos.PosStockTransferRow;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class StockExportRowMapper {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withZone(ZONE);

    public List<Map<String, Object>> balanceRows(List<PosStockBalanceRow> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (PosStockBalanceRow row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("product_name", row.productName());
            mapped.put("sku", row.sku());
            mapped.put("barcode", blank(row.barcode()));
            mapped.put("category", blank(row.categoryName()));
            mapped.put("stock_qty", row.stockQuantity());
            mapped.put("min_qty", row.lowStockAlert());
            mapped.put("cost_price", row.costPrice());
            mapped.put("stock_value", row.stockValue());
            data.add(mapped);
        }
        return data;
    }

    public List<Map<String, Object>> deadStockRows(List<PosDeadStockRow> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (PosDeadStockRow row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("product_name", row.productName());
            mapped.put("sku", row.sku());
            mapped.put("barcode", blank(row.barcode()));
            mapped.put("category", blank(row.categoryName()));
            mapped.put("stock_qty", row.stockQuantity());
            mapped.put("stock_value", row.stockValue());
            mapped.put("last_sale_date", row.lastSaleDate() != null ? row.lastSaleDate().toString() : "");
            mapped.put("days_idle", row.daysWithoutSale());
            data.add(mapped);
        }
        return data;
    }

    public List<Map<String, Object>> movementRows(List<PosStockMovementRow> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (PosStockMovementRow row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("created_at", format(row.createdAt()));
            mapped.put("product_name", row.productName());
            mapped.put("sku", row.sku());
            mapped.put("quantity", row.quantity());
            mapped.put("store", blank(row.storeName()));
            mapped.put("user", blank(row.createdByName()));
            mapped.put("notes", blank(row.notes()));
            mapped.put("doc_no", blank(row.receiptNumber()));
            data.add(mapped);
        }
        return data;
    }

    public List<Map<String, Object>> inventoryRows(List<PosStockInventoryRow> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (PosStockInventoryRow row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("inventory_no", row.inventoryNumber());
            mapped.put("created_at", format(row.createdAt()));
            mapped.put("store", blank(row.storeName()));
            mapped.put("lines", row.totalLines());
            mapped.put("diff_sum", row.totalDifference());
            mapped.put("user", blank(row.createdByName()));
            mapped.put("notes", blank(row.notes()));
            data.add(mapped);
        }
        return data;
    }

    public List<Map<String, Object>> transferRows(List<PosStockTransferRow> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (PosStockTransferRow row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("transfer_no", row.transferNumber());
            mapped.put("created_at", format(row.createdAt()));
            mapped.put("from_store", row.fromStoreName());
            mapped.put("to_store", row.toStoreName());
            mapped.put("total_qty", row.totalQuantity());
            mapped.put("user", blank(row.createdByName()));
            mapped.put("notes", blank(row.notes()));
            data.add(mapped);
        }
        return data;
    }

    private static String format(Instant instant) {
        return instant != null ? DATE_TIME.format(instant) : "";
    }

    private static String blank(String value) {
        return value != null ? value : "";
    }
}
