package com.pos.reporting.service;

import com.pos.reporting.dto.TopProductRowResponse;
import java.time.LocalDate;
import java.util.List;

public interface TopProductsService {

    List<TopProductRowResponse> topProducts(int limit, LocalDate from, LocalDate to);
}

