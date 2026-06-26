package com.pos.reporting.service.impl;

import com.pos.reporting.service.CategorySalesReportService;

import com.pos.reporting.dto.CategorySalesRowResponse;
import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.mapper.SaleReportRowMapper;
import com.pos.reporting.repository.SaleItemFactRepository;
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
public class CategorySalesReportServiceImpl implements CategorySalesReportService {

    private final SaleItemFactRepository saleItemFactRepository;
    private final SaleReportRowMapper saleReportRowMapper;

    @Override
    public PageResponse<CategorySalesRowResponse> byCategories(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        Page<Object[]> page = saleItemFactRepository.categorySalesPage(
            companyId,
            from,
            to,
            storeId,
            pageable
        );
        List<CategorySalesRowResponse> content = page.getContent().stream()
            .map(saleReportRowMapper::toCategorySalesRow)
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
