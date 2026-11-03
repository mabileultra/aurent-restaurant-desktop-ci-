package com.pos.catalog.service;

import com.pos.catalog.dto.ProductCardResponse;
import com.pos.catalog.dto.ProductRefResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.exception.CatalogExceptions;
import com.pos.catalog.mapper.ProductCardMapper;
import com.pos.catalog.repository.ProductBarcodeRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.shared.api.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductQueryService {

    private final ProductRepository productRepository;
    private final ProductBarcodeRepository productBarcodeRepository;
    private final ProductCardMapper mapper;

    public ProductCardResponse getCard(UUID id, Integer companyId) {
        Product product = productRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> CatalogExceptions.notFound("Товар не найден"));
        return mapper.toCard(product);
    }

    public PageResponse<ProductCardResponse> page(
        Integer companyId,
        String search,
        boolean activeOnly,
        Pageable pageable
    ) {
        String q = StringUtils.hasText(search) ? search.trim() : null;
        String exact = q;
        Page<Product> page = productRepository.pageByCompany(companyId, q, exact, activeOnly, pageable);
        return PageResponse.of(
            page.getContent().stream().map(mapper::toCard).toList(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements()
        );
    }

    public List<ProductRefResponse> searchActive(Integer companyId, String searchText, int limit) {
        String q = searchText == null ? "" : searchText.trim();
        int size = Math.min(Math.max(limit, 1), 100);
        return productRepository.searchActive(companyId, q, q, PageRequest.of(0, size)).stream()
            .map(mapper::toRef)
            .toList();
    }

    public Optional<ProductRefResponse> findRefById(UUID id) {
        return productRepository.findById(id).map(mapper::toRef);
    }

    public Optional<ProductRefResponse> findActiveRef(UUID id, Integer companyId) {
        return productRepository.findByIdAndCompanyId(id, companyId)
            .filter(Product::isActive)
            .map(mapper::toRef);
    }

    public ProductRefResponse requireActiveRef(UUID id, Integer companyId) {
        return findActiveRef(id, companyId)
            .orElseThrow(() -> CatalogExceptions.notFound("Активный товар не найден"));
    }

    public Optional<ProductRefResponse> findByBarcode(Integer companyId, String barcode) {
        if (!StringUtils.hasText(barcode)) {
            return Optional.empty();
        }
        String code = barcode.trim();
        Optional<ProductRefResponse> primary = productRepository
            .findByCompanyIdAndBarcodeAndActiveTrue(companyId, code)
            .map(mapper::toRef);
        if (primary.isPresent()) {
            return primary;
        }
        return productBarcodeRepository.findActiveByCompanyAndBarcode(companyId, code)
            .map(b -> mapper.toRef(b.getProduct()));
    }
}
