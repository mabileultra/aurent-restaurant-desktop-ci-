package com.pos.reporting.service;

import com.pos.reporting.dto.CategorySalesRowResponse;
import com.pos.reporting.dto.PageResponse;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategorySalesReportService {

    PageResponse<CategorySalesRowResponse> byCategories( LocalDate from, LocalDate to, Integer storeId, Pageable pageable );
}

