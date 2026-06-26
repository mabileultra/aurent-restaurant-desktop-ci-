package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockInventoryRow;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface StockInventoryReportService {

    PageResponse<PosStockInventoryRow> inventories(LocalDate from, LocalDate to, Integer storeId, Pageable pageable);

    List<PosStockInventoryRow> listAll(LocalDate from, LocalDate to, Integer storeId);
}
