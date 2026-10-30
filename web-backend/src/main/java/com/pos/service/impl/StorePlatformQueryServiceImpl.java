package com.pos.service.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.store.CompanyStoreGroupResponse;
import com.pos.dto.store.StoreStatsResponse;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.repository.CompanyRepository;
import com.pos.repository.StoreRepository;
import com.pos.repository.spec.CompanySpecifications;
import com.pos.repository.spec.StoreSpecifications;
import com.pos.service.StorePlatformQueryService;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StorePlatformQueryServiceImpl implements StorePlatformQueryService {

    private final StoreRepository storeRepository;
    private final CompanyRepository companyRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public StoreStatsResponse stats(
        String search,
        String status,
        String businessType,
        String regionCode,
        Integer companyId
    ) {
        Integer scopedCompanyId = tenantAccess.resolveScopedCompanyId(companyId);
        Specification<Store> base = StoreSpecifications.filter(
            search, scopedCompanyId, businessType, regionCode, null, null
        );
        long total = storeRepository.count(base);
        long active = storeRepository.count(
            base.and(StoreSpecifications.filter(null, null, null, null, null, "ACTIVE"))
        );
        long inactive = Math.max(0, total - active);
        long companies = countCompanies(scopedCompanyId, search, status, businessType, regionCode);
        return new StoreStatsResponse(total, active, inactive, companies);
    }

    @Override
    public PageResponse<CompanyStoreGroupResponse> listByCompany(
        String search,
        String status,
        String businessType,
        String regionCode,
        Pageable pageable
    ) {
        if (!tenantAccess.isPlatformOperator()) {
            Integer companyId = tenantAccess.resolveScopedCompanyId(null);
            if (companyId == null) {
                return emptyPage(pageable);
            }
            Company company = companyRepository.findById(companyId).orElse(null);
            if (company == null) {
                return emptyPage(pageable);
            }
            Map<Integer, long[]> counts = loadCounts(List.of(companyId));
            long[] c = counts.getOrDefault(companyId, new long[]{0, 0});
            return new PageResponse<>(List.of(toRow(company, c[0], c[1])), 1, 1, pageable.getPageSize(), 0);
        }

        Pageable sorted = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            pageable.getSort().isSorted() ? pageable.getSort() : Sort.by("name").ascending()
        );
        Page<Company> page = companyRepository.findAll(
            CompanySpecifications.filter(search, status, businessType, regionCode),
            sorted
        );
        List<Integer> ids = page.getContent().stream().map(Company::getId).toList();
        Map<Integer, long[]> counts = loadCounts(ids);
        return PageResponse.from(page.map(c -> {
            long[] countsRow = counts.getOrDefault(c.getId(), new long[]{0, 0});
            return toRow(c, countsRow[0], countsRow[1]);
        }));
    }

    private long countCompanies(
        Integer scopedCompanyId,
        String search,
        String status,
        String businessType,
        String regionCode
    ) {
        if (scopedCompanyId != null) {
            return companyRepository.existsById(scopedCompanyId) ? 1L : 0L;
        }
        return companyRepository.count(CompanySpecifications.filter(search, status, businessType, regionCode));
    }

    private Map<Integer, long[]> loadCounts(List<Integer> companyIds) {
        Map<Integer, long[]> result = new HashMap<>();
        if (companyIds == null || companyIds.isEmpty()) {
            return result;
        }
        for (Integer id : companyIds) {
            result.put(id, new long[]{
                storeRepository.countByCompanyId(id),
                storeRepository.countByCompanyIdAndActiveTrue(id)
            });
        }
        return result;
    }

    private static PageResponse<CompanyStoreGroupResponse> emptyPage(Pageable pageable) {
        return new PageResponse<>(List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber());
    }

    private static CompanyStoreGroupResponse toRow(Company company, long storeCount, long activeStoreCount) {
        return new CompanyStoreGroupResponse(
            company.getId(),
            company.getName(),
            company.getLoginCode(),
            company.getBusinessType(),
            company.getRegionCode(),
            company.getDistrictCode(),
            company.isActive(),
            storeCount,
            activeStoreCount
        );
    }
}
