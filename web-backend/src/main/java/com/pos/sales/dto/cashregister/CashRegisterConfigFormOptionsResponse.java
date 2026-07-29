package com.pos.sales.dto.cashregister;

import com.pos.catalog.dto.category.CategoryResponse;
import com.pos.dto.store.StoreResponse;

import java.util.List;

public record CashRegisterConfigFormOptionsResponse(
    List<StoreResponse> stores,
    List<CashRegisterRowResponse> registers,
    List<CategoryResponse> categories
) {}
