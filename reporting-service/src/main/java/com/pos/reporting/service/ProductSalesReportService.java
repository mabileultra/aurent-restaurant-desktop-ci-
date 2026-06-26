package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.ProductSalesRowResponse;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductSalesReportService {

    PageResponse<ProductSalesRowResponse> byProducts( LocalDate from, LocalDate to, Integer storeId, Integer categoryId, String search, Pageable pageable );
}

