package com.pos.restaurant.edge.warehouse.support;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.entity.EdgeWhDocument;
import com.pos.restaurant.edge.entity.EdgeWhLine;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeWhResponses {

    private final EdgeWhTenant tenant;

    public Map<String, Object> product(EdgeProduct p) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.getId());
        m.put("storeId", p.getStoreId());
        m.put("sku", p.getSku());
        m.put("name", p.getName());
        m.put("barcode", p.getBarcode());
        m.put("unitCode", p.getUnitCode());
        m.put("taxRate", p.getTaxRate());
        m.put("costPrice", p.getCostPrice());
        m.put("sellingPrice", p.getSellingPrice());
        m.put("stockQuantity", p.getStockQty());
        m.put("lowStockAlert", p.getLowStockAlert());
        m.put("lowStock", p.getStockQty().compareTo(BigDecimal.valueOf(Math.max(p.getLowStockAlert(), 0))) <= 0);
        m.put("ikpu", p.getIkpu());
        m.put("packageCode", p.getPackageCode());
        m.put("unitOfMeasure", p.getUnitOfMeasure());
        m.put("unitMeasureCode", p.getUnitMeasureCode());
        m.put("markedProduct", p.isMarkedProduct());
        m.put("active", p.isActive());
        return m;
    }

    public Map<String, Object> page(List<Map<String, Object>> content, Page<?> page) {
        Map<String, Object> m = new HashMap<>();
        m.put("content", content);
        m.put("totalPages", page.getTotalPages());
        m.put("totalElements", page.getTotalElements());
        m.put("size", page.getSize());
        m.put("number", page.getNumber());
        m.put("page", page.getNumber());
        return m;
    }

    public Map<String, Object> emptyPage(Pageable pageable) {
        Map<String, Object> m = new HashMap<>();
        m.put("content", List.of());
        m.put("totalPages", 0);
        m.put("totalElements", 0);
        m.put("size", pageable.getPageSize());
        m.put("number", pageable.getPageNumber());
        m.put("page", pageable.getPageNumber());
        return m;
    }

    public Map<String, Object> byType(EdgeWhDocument d, List<EdgeWhLine> lines) {
        return switch (d.getDocType()) {
            case "RECEIPT", "QUICK_RECEIPT" -> receipt(d, lines);
            case "INVENTORY" -> inventory(d, lines);
            case "TRANSFER" -> transfer(d, lines);
            case "EXPENSE" -> expense(d, lines);
            case "PRODUCTION" -> production(d, lines);
            case "WRITE_OFF" -> writeOff(d);
            default -> Map.of("id", d.getId(), "docType", d.getDocType(), "docNumber", d.getDocNumber());
        };
    }

    public Map<String, Object> summary(EdgeWhDocument d, String type) {
        return switch (type) {
            case "RECEIPT" -> receipt(d, List.of());
            case "INVENTORY" -> inventory(d, List.of());
            case "TRANSFER" -> transfer(d, List.of());
            case "EXPENSE" -> expense(d, List.of());
            case "PRODUCTION" -> production(d, List.of());
            default -> Map.of("id", d.getId(), "docNumber", d.getDocNumber(), "createdAt", d.getCreatedAt());
        };
    }

    public Map<String, Object> receipt(EdgeWhDocument d, List<EdgeWhLine> lines) {
        Map<String, Object> m = base(d);
        m.put("receiptNumber", d.getDocNumber());
        m.put("supplierId", d.getSupplierId());
        m.put("supplierName", d.getSupplierName());
        m.put("totalQuantity", d.getTotalQty());
        m.put("totalCost", d.getTotalCost());
        m.put("lines", lines.stream().map(this::receiptLine).toList());
        return m;
    }

    public Map<String, Object> inventory(EdgeWhDocument d, List<EdgeWhLine> lines) {
        Map<String, Object> m = base(d);
        m.put("inventoryNumber", d.getDocNumber());
        m.put("status", d.getStatus() == null ? "POSTED" : d.getStatus());
        m.put("totalLines", d.getTotalLines());
        m.put("totalDifference", d.getTotalDiff());
        m.put("lines", lines.stream().map(this::inventoryLine).toList());
        return m;
    }

    public Map<String, Object> transfer(EdgeWhDocument d, List<EdgeWhLine> lines) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", d.getId());
        m.put("transferNumber", d.getDocNumber());
        m.put("fromStoreId", d.getStoreId());
        m.put("fromStoreName", tenant.storeName(d.getStoreId()));
        m.put("toStoreId", d.getStoreId2());
        m.put("toStoreName", tenant.storeName(d.getStoreId2()));
        m.put("notes", d.getNotes());
        m.put("totalQuantity", d.getTotalQty());
        m.put("createdByName", d.getCreatedByName());
        m.put("createdAt", d.getCreatedAt());
        m.put("lines", lines.stream().map(this::qtyLine).toList());
        return m;
    }

    public Map<String, Object> expense(EdgeWhDocument d, List<EdgeWhLine> lines) {
        Map<String, Object> m = base(d);
        m.put("expenseNumber", d.getDocNumber());
        m.put("reason", d.getReason());
        m.put("recipient", d.getRecipient());
        m.put("totalQuantity", d.getTotalQty());
        m.put("lines", lines.stream().map(this::qtyLine).toList());
        return m;
    }

    public Map<String, Object> production(EdgeWhDocument d, List<EdgeWhLine> lines) {
        Map<String, Object> m = base(d);
        m.put("productionNumber", d.getDocNumber());
        m.put("outputProductId", d.getOutputProductId());
        m.put("outputProductName", d.getOutputProductName());
        m.put("outputQuantity", d.getOutputQty());
        m.put("outputUnitCost", d.getOutputUnitCost());
        m.put("totalInputQuantity", d.getTotalQty());
        m.put("totalInputCost", d.getTotalCost());
        m.put("lines", lines.stream().map(this::productionLine).toList());
        return m;
    }

    public Map<String, Object> writeOff(EdgeWhDocument d) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", d.getId());
        m.put("createdAt", d.getCreatedAt());
        m.put("productId", d.getProductId());
        m.put("productName", d.getProductName());
        m.put("sku", d.getSku());
        m.put("quantity", d.getTotalQty());
        m.put("reason", d.getReason());
        m.put("notes", d.getNotes());
        m.put("storeId", d.getStoreId());
        m.put("storeName", tenant.storeName(d.getStoreId()));
        m.put("createdByName", d.getCreatedByName());
        m.put("lossAmount", d.getLossAmount());
        return m;
    }

    private Map<String, Object> base(EdgeWhDocument d) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", d.getId());
        m.put("storeId", d.getStoreId());
        m.put("storeName", tenant.storeName(d.getStoreId()));
        m.put("notes", d.getNotes());
        m.put("createdByName", d.getCreatedByName());
        m.put("createdAt", d.getCreatedAt());
        return m;
    }

    private Map<String, Object> receiptLine(EdgeWhLine l) {
        Map<String, Object> row = qtyLine(l);
        row.put("purchasePrice", l.getPurchasePrice());
        row.put("unitSellingPrice", l.getUnitSellingPrice());
        row.put("lineCost", l.getLineCost());
        return row;
    }

    private Map<String, Object> inventoryLine(EdgeWhLine l) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", l.getId());
        row.put("productId", l.getProductId());
        row.put("productName", l.getProductName());
        row.put("sku", l.getSku());
        row.put("systemQuantity", l.getSystemQty());
        row.put("countedQuantity", l.getCountedQty());
        row.put("difference", l.getDifference());
        return row;
    }

    private Map<String, Object> qtyLine(EdgeWhLine l) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", l.getId());
        row.put("productId", l.getProductId());
        row.put("productName", l.getProductName());
        row.put("sku", l.getSku());
        row.put("quantity", l.getQuantity());
        return row;
    }

    private Map<String, Object> productionLine(EdgeWhLine l) {
        Map<String, Object> row = qtyLine(l);
        row.put("unitCost", l.getUnitCost());
        row.put("lineCost", l.getLineCost());
        return row;
    }
}
