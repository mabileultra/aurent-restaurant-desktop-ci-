package com.pos.restaurant.edge.warehouse;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.entity.EdgeWhDocument;
import com.pos.restaurant.edge.entity.EdgeWhLine;
import com.pos.restaurant.edge.warehouse.support.EdgeWhDocWriter;
import com.pos.restaurant.edge.warehouse.support.EdgeWhMaps;
import com.pos.restaurant.edge.warehouse.support.EdgeWhResponses;
import com.pos.restaurant.edge.warehouse.support.EdgeWhStockOps;
import com.pos.restaurant.edge.warehouse.support.EdgeWhTenant;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeWhInventoryService {

    private final EdgeWhTenant tenant;
    private final EdgeWhStockOps stock;
    private final EdgeWhDocWriter docs;
    private final EdgeWhResponses responses;

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        Integer companyId = tenant.requireCompany();
        Integer storeId = tenant.resolveStore(EdgeWhMaps.intOr(body.get("storeId"), null), companyId);
        List<Map<String, Object>> lines = EdgeWhMaps.lines(body);
        EdgeWhDocument doc = docs.create(companyId, "INVENTORY", "INV", storeId);
        doc.setNotes(EdgeWhMaps.str(body.get("notes")));
        doc.setStatus("POSTED");

        BigDecimal totalDiff = BigDecimal.ZERO;
        List<EdgeWhLine> saved = new ArrayList<>();
        for (Map<String, Object> row : lines) {
            UUID productId = EdgeWhMaps.uuid(row.get("productId"));
            BigDecimal counted = EdgeWhMaps.nz(EdgeWhMaps.dec(row.get("countedQuantity")));
            EdgeProduct p = stock.require(companyId, storeId, productId);
            BigDecimal system = EdgeWhMaps.nz(p.getStockQty());
            BigDecimal diff = counted.subtract(system);
            stock.setQty(p, counted);
            totalDiff = totalDiff.add(diff);
            EdgeWhLine line = docs.saveLine(doc.getId(), p, diff.abs(), null, null, null, null, null, null, null);
            line.setSystemQty(system);
            line.setCountedQty(counted);
            line.setDifference(diff);
            docs.save(line);
            saved.add(line);
        }
        doc.setTotalDiff(totalDiff);
        doc.setTotalLines(saved.size());
        docs.save(doc);
        return responses.inventory(doc, saved);
    }
}
