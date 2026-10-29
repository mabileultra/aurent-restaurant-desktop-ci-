package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.repository.EdgeProductRepository;
import com.pos.restaurant.edge.service.support.EdgeStockReportSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.pos.restaurant.edge.service.support.EdgeStockReportSupport.nz;
import static com.pos.restaurant.edge.service.support.EdgeStockReportSupport.emptyPage;
import static com.pos.restaurant.edge.service.support.EdgeStockReportSupport.pageOf;

/** Dashboard / balances / low-stock from local edge_products (+ WH doc sums). */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStockSnapshotReportService {

    private final EdgeProductRepository productRepository;
    private final EdgeStockReportSupport support;
    private final JdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard(LocalDate from, LocalDate to, Integer storeId) {
        Integer companyId = support.requireCompany();
        Integer sid = support.resolveStore(companyId, storeId);
        Instant fromI = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toI = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<EdgeProduct> products = sid == null
            ? List.of()
            : productRepository.findByCompanyIdAndStoreIdAndActiveTrue(companyId, sid, PageRequest.of(0, 5000))
                .getContent();

        BigDecimal stockQty = BigDecimal.ZERO;
        BigDecimal stockCost = BigDecimal.ZERO;
        BigDecimal stockRetail = BigDecimal.ZERO;
        long low = 0;
        for (EdgeProduct p : products) {
            BigDecimal q = nz(p.getStockQty());
            stockQty = stockQty.add(q);
            stockCost = stockCost.add(q.multiply(nz(p.getCostPrice())));
            stockRetail = stockRetail.add(q.multiply(nz(p.getSellingPrice())));
            if (q.compareTo(BigDecimal.valueOf(Math.max(p.getLowStockAlert(), 0))) <= 0) low++;
        }

        long received = sumDocQty(companyId, sid, "RECEIPT", fromI, toI)
            + sumDocQty(companyId, sid, "QUICK_RECEIPT", fromI, toI);
        long writeOff = sumDocQty(companyId, sid, "WRITE_OFF", fromI, toI);
        BigDecimal receivedCost = sumDocCost(companyId, sid, "RECEIPT", fromI, toI)
            .add(sumDocCost(companyId, sid, "QUICK_RECEIPT", fromI, toI));
        BigDecimal writeOffCost = sumDocCost(companyId, sid, "WRITE_OFF", fromI, toI);

        Map<String, Object> out = new HashMap<>();
        out.put("receivedUnits", received);
        out.put("receivedCostEstimate", receivedCost);
        out.put("soldUnits", 0L);
        out.put("writeOffUnits", writeOff);
        out.put("writeOffCostEstimate", writeOffCost);
        out.put("currentStockUnits", stockQty.longValue());
        out.put("currentStockCostEstimate", stockCost);
        out.put("currentStockRetailEstimate", stockRetail);
        out.put("lowStockSkuCount", low);
        out.put("dailyBreakdown", List.of());
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> balances(Integer storeId, String search, Boolean onlyWithStock, int page, int size) {
        Integer companyId = support.requireCompany();
        Integer sid = support.resolveStore(companyId, storeId);
        if (sid == null) return emptyPage(page, size);
        String q = StringUtils.hasText(search) ? search.trim() : null;
        Page<EdgeProduct> result = productRepository.search(
            companyId, sid, q, true, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200))
        );
        List<Map<String, Object>> content = new ArrayList<>();
        for (EdgeProduct p : result.getContent()) {
            if (Boolean.TRUE.equals(onlyWithStock) && nz(p.getStockQty()).signum() <= 0) continue;
            Map<String, Object> row = new HashMap<>();
            row.put("productId", p.getId());
            row.put("productName", p.getName());
            row.put("sku", p.getSku());
            row.put("barcode", p.getBarcode());
            row.put("categoryName", null);
            row.put("stockQuantity", p.getStockQty());
            row.put("lowStockAlert", p.getLowStockAlert());
            row.put("costPrice", p.getCostPrice());
            row.put("stockValue", nz(p.getStockQty()).multiply(nz(p.getCostPrice())));
            content.add(row);
        }
        return pageOf(content, result.getTotalElements(), page, size);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> lowStock(int page, int size) {
        Integer companyId = support.requireCompany();
        Integer sid = support.firstStore(companyId);
        if (sid == null) return emptyPage(page, size);
        List<EdgeProduct> all = productRepository
            .findByCompanyIdAndStoreIdAndActiveTrue(companyId, sid, PageRequest.of(0, 5000))
            .getContent()
            .stream()
            .filter(p -> nz(p.getStockQty()).compareTo(BigDecimal.valueOf(Math.max(p.getLowStockAlert(), 0))) <= 0)
            .toList();
        int fromIdx = Math.min(page * size, all.size());
        int toIdx = Math.min(fromIdx + size, all.size());
        List<Map<String, Object>> content = new ArrayList<>();
        for (EdgeProduct p : all.subList(fromIdx, toIdx)) {
            BigDecimal deficit = BigDecimal.valueOf(Math.max(p.getLowStockAlert(), 0)).subtract(nz(p.getStockQty()));
            Map<String, Object> row = new HashMap<>();
            row.put("productId", p.getId());
            row.put("productName", p.getName());
            row.put("sku", p.getSku());
            row.put("barcode", p.getBarcode());
            row.put("stockQuantity", p.getStockQty());
            row.put("lowStockAlert", p.getLowStockAlert());
            row.put("deficit", deficit.signum() < 0 ? BigDecimal.ZERO : deficit);
            row.put("costPrice", p.getCostPrice());
            row.put("stockValueEstimate", nz(p.getStockQty()).multiply(nz(p.getCostPrice())));
            content.add(row);
        }
        return pageOf(content, all.size(), page, size);
    }

    private long sumDocQty(Integer companyId, Integer storeId, String type, Instant from, Instant to) {
        Long v = jdbc.queryForObject("""
            SELECT COALESCE(SUM(total_qty), 0) FROM edge_wh_docs
            WHERE company_id = ? AND doc_type = ?
              AND created_at >= ? AND created_at < ?
              AND (? IS NULL OR store_id = ? OR store_id_2 = ?)
            """, Long.class, companyId, type, Timestamp.from(from), Timestamp.from(to),
            storeId, storeId, storeId);
        return v == null ? 0L : v;
    }

    private BigDecimal sumDocCost(Integer companyId, Integer storeId, String type, Instant from, Instant to) {
        BigDecimal v = jdbc.queryForObject("""
            SELECT COALESCE(SUM(total_cost), 0) FROM edge_wh_docs
            WHERE company_id = ? AND doc_type = ?
              AND created_at >= ? AND created_at < ?
              AND (? IS NULL OR store_id = ? OR store_id_2 = ?)
            """, BigDecimal.class, companyId, type, Timestamp.from(from), Timestamp.from(to),
            storeId, storeId, storeId);
        return v == null ? BigDecimal.ZERO : v;
    }
}
