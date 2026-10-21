package com.pos.restaurant.edge.warehouse;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.entity.EdgeWhDocument;
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
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeWhWriteOffService {

    private final EdgeWhTenant tenant;
    private final EdgeWhStockOps stock;
    private final EdgeWhDocWriter docs;
    private final EdgeWhResponses responses;

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        Integer companyId = tenant.requireCompany();
        Integer storeId = tenant.resolveStore(EdgeWhMaps.intOr(body.get("storeId"), null), companyId);
        UUID productId = EdgeWhMaps.uuid(body.get("productId"));
        BigDecimal qty = EdgeWhMaps.requirePositive(EdgeWhMaps.dec(body.get("quantity")), "quantity");
        String reason = EdgeWhMaps.str(body.get("reason"));
        if (!StringUtils.hasText(reason)) throw new BusinessException("reason required");

        EdgeProduct p = stock.require(companyId, storeId, productId);
        stock.decrease(p, qty);

        EdgeWhDocument doc = docs.create(companyId, "WRITE_OFF", "WO", storeId);
        doc.setProductId(p.getId());
        doc.setProductName(p.getName());
        doc.setSku(p.getSku());
        doc.setReason(reason);
        doc.setNotes(EdgeWhMaps.str(body.get("notes")));
        doc.setTotalQty(qty);
        doc.setLossAmount(EdgeWhMaps.nz(p.getCostPrice()).multiply(qty));
        doc.setTotalLines(1);
        docs.save(doc);
        return responses.writeOff(doc);
    }
}
