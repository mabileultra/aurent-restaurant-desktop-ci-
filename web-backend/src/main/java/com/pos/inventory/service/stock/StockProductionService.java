package com.pos.inventory.service.stock;

import com.pos.dto.shared.PageResponse;
import com.pos.inventory.dto.warehouse.CreateStockProductionRequest;
import com.pos.inventory.dto.warehouse.StockProductionResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface StockProductionService {

    StockProductionResponse create(CreateStockProductionRequest request);

    StockProductionResponse getById(UUID id);

    PageResponse<StockProductionResponse> list(LocalDate from, LocalDate to, Integer storeId, Pageable pageable);
}
