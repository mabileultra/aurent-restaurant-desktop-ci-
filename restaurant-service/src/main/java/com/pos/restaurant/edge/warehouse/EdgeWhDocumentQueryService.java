package com.pos.restaurant.edge.warehouse;

import com.pos.restaurant.edge.entity.EdgeWhDocument;
import com.pos.restaurant.edge.entity.EdgeWhLine;
import com.pos.restaurant.edge.repository.EdgeWhDocumentRepository;
import com.pos.restaurant.edge.repository.EdgeWhLineRepository;
import com.pos.restaurant.edge.warehouse.support.EdgeWhResponses;
import com.pos.restaurant.edge.warehouse.support.EdgeWhTenant;
import com.pos.restaurant.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeWhDocumentQueryService {

    private final EdgeWhDocumentRepository docRepository;
    private final EdgeWhLineRepository lineRepository;
    private final EdgeWhTenant tenant;
    private final EdgeWhResponses responses;

    @Transactional(readOnly = true)
    public Map<String, Object> get(UUID id) {
        EdgeWhDocument doc = require(id);
        List<EdgeWhLine> lines = lineRepository.findByDocIdOrderByProductNameAsc(id);
        return responses.byType(doc, lines);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> list(String type, LocalDate from, LocalDate to, Integer storeId, Pageable pageable) {
        Integer companyId = tenant.requireCompany();
        Instant fromI = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toI = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Page<EdgeWhDocument> page = docRepository.listByType(companyId, type, fromI, toI, storeId, pageable);
        List<Map<String, Object>> content = page.getContent().stream()
            .map(d -> responses.summary(d, type))
            .toList();
        return responses.page(content, page);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listTransfers(
        LocalDate from, LocalDate to, Integer fromStoreId, Integer toStoreId, Pageable pageable
    ) {
        Integer companyId = tenant.requireCompany();
        Instant fromI = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toI = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Page<EdgeWhDocument> page = docRepository.listTransfers(
            companyId, fromI, toI, fromStoreId, toStoreId, pageable
        );
        List<Map<String, Object>> content = page.getContent().stream()
            .map(d -> responses.summary(d, "TRANSFER"))
            .toList();
        return responses.page(content, page);
    }

    private EdgeWhDocument require(UUID id) {
        Integer companyId = tenant.requireCompany();
        return docRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new NotFoundException("Document not found"));
    }
}
