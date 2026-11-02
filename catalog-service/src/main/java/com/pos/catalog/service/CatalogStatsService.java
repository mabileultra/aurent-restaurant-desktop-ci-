package com.pos.catalog.service;

import com.pos.catalog.dto.CatalogStatsResponse;
import com.pos.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogStatsService {

    private final ProductRepository productRepository;

    public CatalogStatsResponse stats(Integer companyId) {
        if (companyId == null) {
            long total = productRepository.count();
            long active = productRepository.countByActiveTrue();
            return new CatalogStatsResponse(null, total, active, total - active);
        }
        long total = productRepository.countByCompanyId(companyId);
        long active = productRepository.countByCompanyIdAndActiveTrue(companyId);
        long inactive = productRepository.countByCompanyIdAndActiveFalse(companyId);
        return new CatalogStatsResponse(companyId, total, active, inactive);
    }
}
