package com.pos.catalog.service;

import com.pos.catalog.dto.category.CategoryResponse;
import com.pos.catalog.dto.category.CreateCategoryRequest;
import com.pos.catalog.dto.category.UpdateCategoryRequest;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> findAll(Integer businessTypeId);

    /**
     * POS list: same as {@link #findAll} then filtered by cash-register category config
     * for {@code storeId}/{@code cashRegisterId}. Admin callers keep {@link #findAll}.
     */
    List<CategoryResponse> findAllForPos(Integer businessTypeId, Integer storeId, Long cashRegisterId);

    CategoryResponse create(CreateCategoryRequest req);

    CategoryResponse update(Integer id, UpdateCategoryRequest req);

    void delete(Integer id);
}
