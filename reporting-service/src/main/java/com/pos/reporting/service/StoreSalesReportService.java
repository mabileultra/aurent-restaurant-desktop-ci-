package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.StoreSalesRowResponse;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StoreSalesReportService {

    PageResponse<StoreSalesRowResponse> byStores(LocalDate from, LocalDate to, Pageable pageable);
}

