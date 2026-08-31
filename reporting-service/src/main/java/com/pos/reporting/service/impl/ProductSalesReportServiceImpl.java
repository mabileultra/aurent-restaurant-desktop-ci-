package com.pos.reporting.service.impl;

import com.pos.reporting.service.ProductSalesReportService;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.ProductSalesRowResponse;
import com.pos.reporting.mapper.SaleReportRowMapper;
import com.pos.reporting.repository.SaleItemFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import com.pos.reporting.util.ReportingSearchSupport;
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
public class ProductSalesReportServiceImpl implements ProductSalesReportService {

    private final SaleItemFactRepository saleItemFactRepository;
    private final SaleReportRowMapper saleReportRowMapper;

    @Override
    public PageResponse<ProductSalesRowResponse> byProducts(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        Integer companyId = ReportingTenantContext.requireCompanyId();
        Page<Object[]> page = saleItemFactRepository.productSalesPage(
            companyId,
            from,
            to,
            storeId,
            categoryId,
            ReportingSearchSupport.toContainsPattern(search),
            pageable
        );
        List<ProductSalesRowResponse> content = page.getContent().stream()
            .map(saleReportRowMapper::toProductSalesRow)
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
