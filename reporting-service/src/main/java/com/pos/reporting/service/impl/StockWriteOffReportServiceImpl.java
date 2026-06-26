package com.pos.reporting.service.impl;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosWriteOffRow;
import com.pos.reporting.entity.StockMovementFact;
import com.pos.reporting.mapper.StockMovementRowMapper;
import com.pos.reporting.repository.StockMovementFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.StockWriteOffReportService;
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
public class StockWriteOffReportServiceImpl implements StockWriteOffReportService {

    private final StockMovementFactRepository stockMovementFactRepository;
    private final StockMovementRowMapper stockMovementRowMapper;

    @Override
    public PageResponse<PosWriteOffRow> writeOffs(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        Page<StockMovementFact> page = stockMovementFactRepository.pageWriteOffs(
            companyId,
            from,
            to,
            storeId,
            pageable
        );
        List<PosWriteOffRow> content = page.getContent().stream()
            .map(stockMovementRowMapper::toWriteOffRow)
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
