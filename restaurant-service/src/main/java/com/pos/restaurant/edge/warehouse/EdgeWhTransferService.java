package com.pos.restaurant.edge.warehouse;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.entity.EdgeWhDocument;
import com.pos.restaurant.edge.entity.EdgeWhLine;
import com.pos.restaurant.edge.warehouse.support.EdgeWhDocWriter;
import com.pos.restaurant.edge.warehouse.support.EdgeWhMaps;
import com.pos.restaurant.edge.warehouse.support.EdgeWhResponses;
import com.pos.restaurant.edge.warehouse.support.EdgeWhStockOps;
import com.pos.restaurant.edge.warehouse.support.EdgeWhTenant;
import com.pos.restaurant.exception.BusinessException;
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
public class EdgeWhTransferService {

    private final EdgeWhTenant tenant;
    private final EdgeWhStockOps stock;
    private final EdgeWhDocWriter docs;
    private final EdgeWhResponses responses;

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        Integer companyId = tenant.requireCompany();
        Integer fromStoreId = EdgeWhMaps.intOr(body.get("fromStoreId"), null);
        Integer toStoreId = EdgeWhMaps.intOr(body.get("toStoreId"), null);
        if (fromStoreId == null || toStoreId == null) {
            throw new BusinessException("fromStoreId and toStoreId required");
        }
        if (fromStoreId.equals(toStoreId)) {
            throw new BusinessException("Stores must differ");
        }
        List<Map<String, Object>> lines = EdgeWhMaps.lines(body);
        EdgeWhDocument doc = docs.create(companyId, "TRANSFER", "TR", fromStoreId);
        doc.setStoreId2(toStoreId);
        doc.setNotes(EdgeWhMaps.str(body.get("notes")));

        BigDecimal totalQty = BigDecimal.ZERO;
        List<EdgeWhLine> saved = new ArrayList<>();
        for (Map<String, Object> row : lines) {
            UUID productId = EdgeWhMaps.uuid(row.get("productId"));
            BigDecimal qty = EdgeWhMaps.requirePositive(EdgeWhMaps.dec(row.get("quantity")), "quantity");
            EdgeProduct from = stock.require(companyId, fromStoreId, productId);
            stock.decrease(from, qty);
            EdgeProduct to = stock.findOrClone(companyId, toStoreId, productId, from);
            stock.increase(to, qty);
            totalQty = totalQty.add(qty);
            saved.add(docs.saveLine(doc.getId(), from, qty, null, null, null, null, null, null, null));
        }
        doc.setTotalQty(totalQty);
        doc.setTotalLines(saved.size());
        docs.save(doc);
        return responses.transfer(doc, saved);
    }
}
