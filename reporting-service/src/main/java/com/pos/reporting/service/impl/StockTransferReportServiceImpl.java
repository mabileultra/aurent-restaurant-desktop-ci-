package com.pos.reporting.service.impl;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockTransferRow;
import com.pos.reporting.entity.StockTransferFact;
import com.pos.reporting.mapper.StockDocumentRowMapper;
import com.pos.reporting.repository.StockTransferFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.StockTransferReportService;
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
public class StockTransferReportServiceImpl implements StockTransferReportService {

    private final StockTransferFactRepository stockTransferFactRepository;
    private final StockDocumentRowMapper stockDocumentRowMapper;

    @Override
    public PageResponse<PosStockTransferRow> transfers(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId,
        Pageable pageable
    ) {
        Page<StockTransferFact> page = stockTransferFactRepository.pageTransfers(
            ReportingTenantContext.requireCompanyId(),
            from,
            to,
            fromStoreId,
            toStoreId,
            pageable
        );
        List<PosStockTransferRow> content = page.getContent().stream()
            .map(stockDocumentRowMapper::toTransferRow)
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
    public List<PosStockTransferRow> listAll(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId
    ) {
        return ReportingPageCollector.collectAll(
            (page, size) -> transfers(from, to, fromStoreId, toStoreId, PageRequest.of(page, size))
        );
    }
}
