package com.pos.catalog.service;

import com.pos.catalog.dto.category.CategoryResponse;
import com.pos.catalog.dto.category.CreateCategoryRequest;
import com.pos.catalog.dto.category.UpdateCategoryRequest;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> findAll(Integer businessTypeId);

    CategoryResponse create(CreateCategoryRequest req);

    CategoryResponse update(Integer id, UpdateCategoryRequest req);

    void delete(Integer id);
}
