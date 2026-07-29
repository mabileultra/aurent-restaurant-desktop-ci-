package com.pos.catalog.service.impl;

import com.pos.catalog.dto.category.CategoryResponse;
import com.pos.catalog.dto.category.CreateCategoryRequest;
import com.pos.catalog.dto.category.UpdateCategoryRequest;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.catalog.entity.Category;
import com.pos.entity.Company;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.catalog.mapper.CategoryMapper;
import com.pos.repository.BusinessTypeDefinitionRepository;
import com.pos.catalog.repository.CategoryRepository;
import com.pos.catalog.service.CategoryService;
import com.pos.service.CompanyBusinessTypeAssignmentService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final TenantAccessSupport tenantAccess;
    private final BusinessTypeDefinitionRepository typeRepository;
    private final CompanyBusinessTypeAssignmentService companyBusinessTypeAssignmentService;

    @Override
    @Cacheable(value = "categories", key = "@tenantCacheKeyResolver.categories(#businessTypeId)")
    public List<CategoryResponse> findAll(Integer businessTypeId) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        if (businessTypeId != null) {
            companyBusinessTypeAssignmentService.assertAllowedForCompany(companyId, businessTypeId);
        }
        return categoryMapper.toResponseList(
            categoryRepository.findByCompanyIdFiltered(companyId, businessTypeId)
        );
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse create(CreateCategoryRequest req) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        if (categoryRepository.existsByNameIgnoreCaseAndCompanyId(req.name(), companyId)) {
            throw new BadRequestException("Category already exists");
        }
        Company company = tenantAccess.requireCompany(companyId);
        BusinessTypeDefinition businessType = resolveBusinessType(companyId, req.businessTypeId());
        Category cat = Category.builder()
            .company(company)
            .name(req.name())
            .description(req.description())
            .businessType(businessType)
            .build();
        Category saved = categoryRepository.save(cat);
        LogUtil.info(CategoryServiceImpl.class, "Category created: id={}, name={}", saved.getId(), saved.getName());
        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse update(Integer id, UpdateCategoryRequest req) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        tenantAccess.assertCanAccessCompany(cat.getCompany().getId());
        String name = req.name().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndCompanyIdAndIdNot(name, cat.getCompany().getId(), id)) {
            throw new BadRequestException("Category already exists");
        }
        cat.setName(name);
        cat.setDescription(req.description());
        cat.setBusinessType(resolveBusinessType(cat.getCompany().getId(), req.businessTypeId()));
        Category saved = categoryRepository.save(cat);
        LogUtil.info(CategoryServiceImpl.class, "Category updated: id={}", id);
        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void delete(Integer id) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        tenantAccess.assertCanAccessCompany(cat.getCompany().getId());
        categoryRepository.delete(cat);
        LogUtil.info(CategoryServiceImpl.class, "Category deleted: id={}", id);
    }

    private BusinessTypeDefinition resolveBusinessType(Integer companyId, Integer businessTypeId) {
        if (businessTypeId == null) {
            return null;
        }
        companyBusinessTypeAssignmentService.assertAllowedForCompany(companyId, businessTypeId);
        return typeRepository.findById(businessTypeId)
            .filter(BusinessTypeDefinition::isActive)
            .orElseThrow(() -> new ResourceNotFoundException("Business type not found"));
    }
}
