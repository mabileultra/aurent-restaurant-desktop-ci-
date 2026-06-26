package com.pos.reporting.service.impl;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockMovementRow;
import com.pos.reporting.entity.StockMovementFact;
import com.pos.reporting.mapper.StockMovementRowMapper;
import com.pos.reporting.repository.StockMovementFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.service.StockMovementReportService;
import com.pos.reporting.util.ReportingPageCollector;
import com.pos.reporting.util.ReportingSearchSupport;
import com.pos.reporting.util.StockMovementTypeFilter;
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
public class StockMovementReportServiceImpl implements StockMovementReportService {

    private final StockMovementFactRepository stockMovementFactRepository;
    private final StockMovementRowMapper stockMovementRowMapper;

    @Override
    public PageResponse<PosStockMovementRow> movements(
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        String search,
        Pageable pageable
    ) {
        Page<StockMovementFact> page = queryPage(from, to, movementType, storeId, search, pageable);
        List<PosStockMovementRow> content = page.getContent().stream()
            .map(stockMovementRowMapper::toMovementRow)
            .toList();
        return toPageResponse(content, page);
    }

    @Override
    public List<PosStockMovementRow> listAll(
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        String search
    ) {
        return ReportingPageCollector.collectAll(
            (page, size) -> movements(from, to, movementType, storeId, search, PageRequest.of(page, size))
        );
    }

    private Page<StockMovementFact> queryPage(
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        String search,
        Pageable pageable
    ) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        return stockMovementFactRepository.pageMovementJournal(
            companyId,
            from,
            to,
            StockMovementTypeFilter.normalize(movementType),
            storeId,
            ReportingSearchSupport.normalizeLikePattern(search),
            pageable
        );
    }

    private static <T> PageResponse<T> toPageResponse(List<T> content, Page<?> page) {
        return new PageResponse<>(
            content,
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber()
        );
    }
}
