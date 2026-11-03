package com.pos.catalog.service.product.support;

import com.pos.catalog.dto.ref.ProductRef;
import com.pos.catalog.entity.Product;
import com.pos.catalog.mapper.ProductRefMapper;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.spec.ProductSpecifications;
import com.pos.exception.PosExceptions;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CatalogProductSearchSupport {

    private final ProductRepository productRepository;
    private final ProductRefMapper productRefMapper;

    @Transactional(readOnly = true)
    public List<ProductRef> searchActive(
        Integer companyId,
        String searchText,
        String barcodeExact,
        int limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return productRepository.findAll(
            ProductSpecifications.catalogFilter(
                companyId,
                searchText,
                null,
                "ACTIVE",
                null,
                null,
                null,
                null,
                barcodeExact,
                null
            ),
            PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.ASC, "name"))
        ).stream()
            .map(productRefMapper::toRef)
            .toList();
    }

    @Transactional(readOnly = true)
    public Optional<ProductRef> findActiveById(UUID productId, Integer companyId) {
        return productRepository.findById(productId)
            .filter(Product::isActive)
            .filter(p -> companyId == null
                || (p.getCompany() != null && companyId.equals(p.getCompany().getId())))
            .map(productRefMapper::toRef);
    }

    @Transactional(readOnly = true)
    public ProductRef requireActiveById(UUID productId, Integer companyId) {
        return findActiveById(productId, companyId)
            .orElseThrow(() -> PosExceptions.notFound("Товар не найден"));
    }
}
