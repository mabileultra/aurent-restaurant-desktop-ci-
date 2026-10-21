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
public class EdgeWhProductionService {

    private final EdgeWhTenant tenant;
    private final EdgeWhStockOps stock;
    private final EdgeWhDocWriter docs;
    private final EdgeWhResponses responses;

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        Integer companyId = tenant.requireCompany();
        Integer storeId = tenant.resolveStore(EdgeWhMaps.intOr(body.get("storeId"), null), companyId);
        UUID outputId = EdgeWhMaps.uuid(body.get("outputProductId"));
        BigDecimal outputQty = EdgeWhMaps.requirePositive(EdgeWhMaps.dec(body.get("outputQuantity")), "outputQuantity");
        BigDecimal outputUnitCost = EdgeWhMaps.nz(EdgeWhMaps.dec(body.get("outputUnitCost")));
        List<Map<String, Object>> lines = EdgeWhMaps.lines(body);

        EdgeProduct output = stock.require(companyId, storeId, outputId);
        EdgeWhDocument doc = docs.create(companyId, "PRODUCTION", "PRD", storeId);
        doc.setOutputProductId(output.getId());
        doc.setOutputProductName(output.getName());
        doc.setOutputQty(outputQty);
        doc.setOutputUnitCost(outputUnitCost);
        doc.setNotes(EdgeWhMaps.str(body.get("notes")));

        BigDecimal totalInputQty = BigDecimal.ZERO;
        BigDecimal totalInputCost = BigDecimal.ZERO;
        List<EdgeWhLine> saved = new ArrayList<>();
        for (Map<String, Object> row : lines) {
            UUID productId = EdgeWhMaps.uuid(row.get("productId"));
            BigDecimal qty = EdgeWhMaps.requirePositive(EdgeWhMaps.dec(row.get("quantity")), "quantity");
            EdgeProduct p = stock.require(companyId, storeId, productId);
            stock.decrease(p, qty);
            BigDecimal unitCost = EdgeWhMaps.nz(p.getCostPrice());
            BigDecimal lineCost = unitCost.multiply(qty);
            totalInputQty = totalInputQty.add(qty);
            totalInputCost = totalInputCost.add(lineCost);
            saved.add(docs.saveLine(doc.getId(), p, qty, null, null, lineCost, null, null, null, unitCost));
        }
        stock.increase(output, outputQty);
        if (outputUnitCost.signum() > 0) output.setCostPrice(outputUnitCost);
        stock.save(output);

        doc.setTotalQty(totalInputQty);
        doc.setTotalCost(totalInputCost);
        doc.setTotalLines(saved.size());
        docs.save(doc);
        return responses.production(doc, saved);
    }
}
