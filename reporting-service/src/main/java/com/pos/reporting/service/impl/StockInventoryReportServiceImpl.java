package com.pos.reporting.service.impl;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockInventoryRow;
import com.pos.reporting.entity.StockInventoryFact;
import com.pos.reporting.mapper.StockDocumentRowMapper;
import com.pos.reporting.repository.StockInventoryFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.StockInventoryReportService;
import com.pos.reporting.util.ReportingPageCollector;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockInventoryReportServiceImpl implements StockInventoryReportService {

    private final StockInventoryFactRepository stockInventoryFactRepository;
    private final StockDocumentRowMapper stockDocumentRowMapper;

    @Override
    public PageResponse<PosStockInventoryRow> inventories(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Page<StockInventoryFact> page = stockInventoryFactRepository.pageInventories(
            ReportingTenantContext.requireCompanyId(),
            from,
            to,
            storeId,
            pageable
        );
        List<PosStockInventoryRow> content = page.getContent().stream()
            .map(stockDocumentRowMapper::toInventoryRow)
            .toList();
        return new PageResponse<>(
            content,
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber()
        );
    }

    @Override
    public List<PosStockInventoryRow> listAll(LocalDate from, LocalDate to, Integer storeId) {
        return ReportingPageCollector.collectAll(
            (page, size) -> inventories(from, to, storeId, PageRequest.of(page, size))
        );
    }
}
