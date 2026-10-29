package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.entity.EdgeWhDocument;
import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.edge.repository.EdgeWhDocumentRepository;
import com.pos.restaurant.edge.service.support.EdgeStockReportSupport;
import com.pos.restaurant.edge.warehouse.support.EdgeWhResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.pos.restaurant.edge.service.support.EdgeStockReportSupport.pageOf;

/** Movements / WH document lists for offline stock reports. */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStockDocReportService {

    private final EdgeWhDocumentRepository docRepository;
    private final EdgeStoreRepository storeRepository;
    private final EdgeWhResponses responses;
    private final EdgeStockReportSupport support;
    private final JdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public Map<String, Object> movements(
        LocalDate from, LocalDate to, Integer storeId, String search, String movementType, int page, int size
    ) {
        Integer companyId = support.requireCompany();
        Instant fromI = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toI = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        String type = StringUtils.hasText(movementType) ? movementType.trim().toUpperCase() : null;
        String q = StringUtils.hasText(search) ? "%" + search.trim().toLowerCase() + "%" : null;

        StringBuilder sql = new StringBuilder("""
            SELECT l.id, d.created_at, d.doc_type, l.product_id, l.product_name, l.sku, l.quantity,
                   d.notes, d.reason, d.store_id, d.doc_number, d.created_by_name, d.id AS doc_id
            FROM edge_wh_lines l
            JOIN edge_wh_docs d ON d.id = l.doc_id
            WHERE d.company_id = ?
              AND d.created_at >= ? AND d.created_at < ?
            """);
        List<Object> args = new ArrayList<>();
        args.add(companyId);
        args.add(Timestamp.from(fromI));
        args.add(Timestamp.from(toI));
        if (storeId != null) {
            sql.append(" AND (d.store_id = ? OR d.store_id_2 = ?)");
            args.add(storeId);
            args.add(storeId);
        }
        if (type != null) {
            sql.append(" AND upper(d.doc_type) = ?");
            args.add(type);
        }
        if (q != null) {
            sql.append(" AND (lower(coalesce(l.product_name,'')) LIKE ? OR lower(coalesce(l.sku,'')) LIKE ?)");
            args.add(q);
            args.add(q);
        }
        sql.append(" ORDER BY d.created_at DESC");

        List<Map<String, Object>> all = jdbc.query(sql.toString(), (rs, i) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", UUID.fromString(rs.getString("id")));
            Timestamp created = rs.getTimestamp("created_at");
            row.put("createdAt", created == null ? null : created.toInstant().toString());
            row.put("movementType", rs.getString("doc_type"));
            row.put("productId", UUID.fromString(rs.getString("product_id")));
            row.put("productName", rs.getString("product_name"));
            row.put("sku", rs.getString("sku"));
            row.put("quantity", rs.getBigDecimal("quantity"));
            row.put("notes", rs.getString("notes"));
            row.put("writeOffReason", rs.getString("reason"));
            Integer sid = (Integer) rs.getObject("store_id");
            row.put("storeId", sid);
            row.put("storeName", sid == null ? null
                : storeRepository.findById(sid).map(s -> s.getName()).orElse(null));
            row.put("createdByName", rs.getString("created_by_name"));
            row.put("referenceId", UUID.fromString(rs.getString("doc_id")));
            row.put("receiptNumber", rs.getString("doc_number"));
            return row;
        }, args.toArray());

        int fromIdx = Math.min(page * size, all.size());
        int toIdx = Math.min(fromIdx + size, all.size());
        return pageOf(all.subList(fromIdx, toIdx), all.size(), page, size);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> docsByType(String type, LocalDate from, LocalDate to, Integer storeId, int page, int size) {
        Integer companyId = support.requireCompany();
        Instant fromI = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toI = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Page<EdgeWhDocument> result = docRepository.listByType(
            companyId, type, fromI, toI, storeId,
            PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200))
        );
        List<Map<String, Object>> content = result.getContent().stream()
            .map(d -> responses.summary(d, type))
            .toList();
        return responses.page(content, result);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> transfers(LocalDate from, LocalDate to, Integer storeId, int page, int size) {
        Integer companyId = support.requireCompany();
        Instant fromI = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toI = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Page<EdgeWhDocument> result = docRepository.listTransfers(
            companyId, fromI, toI, storeId, null,
            PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200))
        );
        List<Map<String, Object>> content = result.getContent().stream()
            .map(d -> responses.summary(d, "TRANSFER"))
            .toList();
        return responses.page(content, result);
    }
}
