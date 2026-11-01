package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.entity.ProductBarcode;
import com.pos.pharmacy.catalog.repository.ProductBarcodeRepository;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.support.PharmacyBarcodeVariants;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCatalogErrors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductBarcodeLookupService {

    private final ProductRepository productRepository;
    private final ProductBarcodeRepository productBarcodeRepository;

    @Transactional(readOnly = true)
    public Product findByScan(Integer companyId, String raw) {
        List<String> candidates = new ArrayList<>(PharmacyBarcodeVariants.of(raw));
        if (candidates.isEmpty() && StringUtils.hasText(raw)) {
            candidates.add(raw.trim());
        }
        if (candidates.isEmpty()) {
            throw PharmacyErrors.notFound(PharmacyCatalogErrors.PHARM_BARCODE_NOT_FOUND, raw);
        }

        Product primary = matchPrimaryBarcode(companyId, candidates);
        if (primary != null) {
            return primary;
        }
        Product extra = matchExtraBarcode(companyId, candidates);
        if (extra != null) {
            return extra;
        }
        Product byIkpu = matchIkpu(companyId, candidates);
        if (byIkpu != null) {
            return byIkpu;
        }
        throw PharmacyErrors.notFound(PharmacyCatalogErrors.PHARM_BARCODE_NOT_FOUND, raw);
    }

    private Product matchIkpu(Integer companyId, List<String> candidates) {
        List<Product> hits = productRepository.findByCompanyIdAndIkpuIn(companyId, candidates);
        if (hits.isEmpty()) {
            return null;
        }
        Map<String, Product> byIkpu = new HashMap<>();
        for (Product product : hits) {
            if (StringUtils.hasText(product.getIkpu())) {
                byIkpu.putIfAbsent(product.getIkpu().trim(), product);
            }
        }
        for (String candidate : candidates) {
            Product found = byIkpu.get(candidate);
            if (found != null) {
                return found;
            }
        }
        return hits.get(0);
    }

    private Product matchPrimaryBarcode(Integer companyId, List<String> candidates) {
        List<Product> hits = productRepository.findByCompanyIdAndBarcodeIn(companyId, candidates);
        if (hits.isEmpty()) {
            return null;
        }
        Map<String, Product> byBarcode = new HashMap<>();
        for (Product product : hits) {
            if (StringUtils.hasText(product.getBarcode())) {
                byBarcode.putIfAbsent(product.getBarcode(), product);
            }
        }
        for (String candidate : candidates) {
            Product found = byBarcode.get(candidate);
            if (found != null) {
                return found;
            }
        }
        return hits.get(0);
    }

    private Product matchExtraBarcode(Integer companyId, List<String> candidates) {
        List<ProductBarcode> rows = productBarcodeRepository.findByBarcodeIn(candidates);
        if (rows.isEmpty()) {
            return null;
        }
        Map<String, UUID> productIdByBarcode = new HashMap<>();
        for (ProductBarcode row : rows) {
            productIdByBarcode.putIfAbsent(row.getBarcode(), row.getProductId());
        }
        Set<UUID> productIds = new HashSet<>(productIdByBarcode.values());
        Map<UUID, Product> products = new HashMap<>();
        for (Product product : productRepository.findAllById(productIds)) {
            if (companyId.equals(product.getCompanyId())) {
                products.put(product.getId(), product);
            }
        }
        for (String candidate : candidates) {
            UUID productId = productIdByBarcode.get(candidate);
            if (productId == null) {
                continue;
            }
            Product found = products.get(productId);
            if (found != null) {
                return found;
            }
        }
        return null;
    }
}
