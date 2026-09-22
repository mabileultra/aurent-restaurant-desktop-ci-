package com.pos.inventory.service.stock;

import com.pos.dto.shared.PageResponse;
import com.pos.inventory.dto.warehouse.CreateStockExpenseRequest;
import com.pos.inventory.dto.warehouse.StockExpenseResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface StockExpenseService {

    StockExpenseResponse create(CreateStockExpenseRequest request);

    StockExpenseResponse getById(UUID id);

    PageResponse<StockExpenseResponse> list(LocalDate from, LocalDate to, Integer storeId, Pageable pageable);
}
