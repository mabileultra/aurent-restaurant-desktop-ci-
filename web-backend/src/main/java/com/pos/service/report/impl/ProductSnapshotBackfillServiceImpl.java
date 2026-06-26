package com.pos.service.report.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.entity.Product;
import com.pos.repository.ProductRepository;
import com.pos.service.event.support.DomainEventMappers;
import com.pos.service.report.ProductSnapshotBackfillService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.event.ProductSnapshotEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductSnapshotBackfillServiceImpl implements ProductSnapshotBackfillService {

    private final ProductRepository productRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<ProductSnapshotEvent> page(int page, int size) {
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        int safeSize = Math.min(Math.max(size, 1), 500);
        Page<Product> products = productRepository.findForReportingSnapshot(
            companyId,
            PageRequest.of(Math.max(page, 0), safeSize)
        );
        List<ProductSnapshotEvent> events = products.getContent().stream()
            .map(DomainEventMappers::toProductSnapshot)
            .filter(Objects::nonNull)
            .toList();
        return new PageResponse<>(
            events,
            products.getTotalPages(),
            products.getTotalElements(),
            products.getSize(),
            products.getNumber()
        );
    }
}
