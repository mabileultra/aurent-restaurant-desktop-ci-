package com.pos.inventory.service.stock;

import com.pos.dto.shared.PageResponse;
import com.pos.inventory.dto.warehouse.CreateStockTransferRequest;
import com.pos.inventory.dto.warehouse.StockTransferResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface StockTransferService {

    StockTransferResponse create(CreateStockTransferRequest request);

    StockTransferResponse getById(UUID id);

    PageResponse<StockTransferResponse> list(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId,
        Pageable pageable
    );
}
