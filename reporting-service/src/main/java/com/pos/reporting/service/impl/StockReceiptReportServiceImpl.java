package com.pos.reporting.service.impl;

import com.pos.reporting.service.StockReceiptReportService;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.StockReceiptRowResponse;
import com.pos.reporting.entity.StockReceiptFact;
import com.pos.reporting.mapper.StockReceiptRowMapper;
import com.pos.reporting.repository.StockReceiptFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockReceiptReportServiceImpl implements StockReceiptReportService {

    private final StockReceiptFactRepository stockReceiptFactRepository;
    private final StockReceiptRowMapper stockReceiptRowMapper;

    @Override
    public PageResponse<StockReceiptRowResponse> receipts(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        Page<StockReceiptFact> page = stockReceiptFactRepository.pageByFilters(
            companyId,
            from,
            to,
            storeId,
            pageable
        );
        List<StockReceiptRowResponse> content = page.getContent().stream()
            .map(stockReceiptRowMapper::toRow)
            .toList();
        return new PageResponse<>(
            content,
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber()
        );
    }
}
