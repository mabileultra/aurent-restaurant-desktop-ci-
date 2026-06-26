package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockTransferRow;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface StockTransferReportService {

    PageResponse<PosStockTransferRow> transfers(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId,
        Pageable pageable
    );

    List<PosStockTransferRow> listAll(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId
    );
}
