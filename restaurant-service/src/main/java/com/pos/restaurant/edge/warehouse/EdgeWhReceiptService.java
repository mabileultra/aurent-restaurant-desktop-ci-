package com.pos.restaurant.edge.warehouse;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.entity.EdgeWhDocument;
import com.pos.restaurant.edge.entity.EdgeWhLine;
import com.pos.restaurant.edge.repository.EdgeSupplierRepository;
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
public class EdgeWhReceiptService {

    private final EdgeWhTenant tenant;
    private final EdgeWhStockOps stock;
    private final EdgeWhDocWriter docs;
    private final EdgeWhResponses responses;
    private final EdgeSupplierRepository supplierRepository;

    @Transactional
    public Map<String, Object> quickReceive(Map<String, Object> body) {
        Integer companyId = tenant.requireCompany();
        Integer storeId = tenant.resolveStore(EdgeWhMaps.intOr(body.get("storeId"), null), companyId);
        UUID productId = EdgeWhMaps.uuid(body.get("productId"));
        BigDecimal qty = EdgeWhMaps.requirePositive(EdgeWhMaps.dec(body.get("quantity")), "quantity");
        EdgeProduct p = stock.require(companyId, storeId, productId);
        BigDecimal purchase = EdgeWhMaps.nz(EdgeWhMaps.dec(body.get("purchasePrice")));
        BigDecimal sell = EdgeWhMaps.nz(EdgeWhMaps.dec(body.get("unitSellingPrice")));
        stock.increase(p, qty);
        if (purchase.signum() > 0) p.setCostPrice(purchase);
        if (sell.signum() > 0) p.setSellingPrice(sell);
        if (body.get("markedProduct") != null) {
            p.setMarkedProduct(Boolean.TRUE.equals(body.get("markedProduct")));
        }
        stock.save(p);

        EdgeWhDocument doc = docs.create(companyId, "QUICK_RECEIPT", "QR", storeId);
        doc.setProductId(p.getId());
        doc.setProductName(p.getName());
        doc.setSku(p.getSku());
        doc.setTotalQty(qty);
        doc.setTotalCost(purchase.multiply(qty));
        doc.setTotalLines(1);
        docs.save(doc);
        docs.saveLine(doc.getId(), p, qty, purchase, sell, purchase.multiply(qty), null, null, null, null);
        return responses.product(p);
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        Integer companyId = tenant.requireCompany();
        Integer storeId = tenant.resolveStore(EdgeWhMaps.intOr(body.get("storeId"), null), companyId);
        List<Map<String, Object>> lines = EdgeWhMaps.lines(body);
        EdgeWhDocument doc = docs.create(companyId, "RECEIPT", "REC", storeId);
        UUID supplierId = EdgeWhMaps.uuid(body.get("supplierId"));
        doc.setSupplierId(supplierId);
        if (supplierId != null) {
            supplierRepository.findByIdAndCompanyId(supplierId, companyId)
                .ifPresent(s -> doc.setSupplierName(s.getName()));
        }
        doc.setNotes(EdgeWhMaps.str(body.get("notes")));

        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        List<EdgeWhLine> saved = new ArrayList<>();
        for (Map<String, Object> row : lines) {
            UUID productId = EdgeWhMaps.uuid(row.get("productId"));
            BigDecimal qty = EdgeWhMaps.requirePositive(EdgeWhMaps.dec(row.get("quantity")), "quantity");
            EdgeProduct p = stock.require(companyId, storeId, productId);
            BigDecimal purchase = EdgeWhMaps.nz(EdgeWhMaps.dec(row.get("purchasePrice")));
            BigDecimal sell = EdgeWhMaps.nz(EdgeWhMaps.dec(row.get("unitSellingPrice")));
            stock.increase(p, qty);
            if (purchase.signum() > 0) p.setCostPrice(purchase);
            if (sell.signum() > 0) p.setSellingPrice(sell);
            stock.save(p);
            BigDecimal lineCost = purchase.multiply(qty);
            totalQty = totalQty.add(qty);
            totalCost = totalCost.add(lineCost);
            saved.add(docs.saveLine(
                doc.getId(), p, qty, purchase, sell, lineCost,
                EdgeWhMaps.intOr(row.get("vatPercent"), null),
                row.get("markedProduct") == null ? null : Boolean.TRUE.equals(row.get("markedProduct")),
                EdgeWhMaps.str(row.get("storageLocation")),
                null
            ));
        }
        doc.setTotalQty(totalQty);
        doc.setTotalCost(totalCost);
        doc.setTotalLines(saved.size());
        docs.save(doc);
        return responses.receipt(doc, saved);
    }
}
