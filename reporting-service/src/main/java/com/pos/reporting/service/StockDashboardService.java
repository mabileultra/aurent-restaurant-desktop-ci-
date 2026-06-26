package com.pos.reporting.service;

import com.pos.reporting.dto.stock.StockDashboardResponse;
import java.time.LocalDate;

public interface StockDashboardService {

    StockDashboardResponse dashboard(LocalDate from, LocalDate to, Integer storeId);
}

