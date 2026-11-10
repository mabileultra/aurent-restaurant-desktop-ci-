package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.entity.ProductBarcode;
import com.pos.pharmacy.catalog.repository.ProductBarcodeRepository;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.support.PharmacyBarcodeVariants;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Сопоставляет строку фактуры с уже существующей карточкой (штрихкод / доп. коды).
 * Остаток не трогает — только id для строки прихода.
 */
@Component
@RequiredArgsConstructor
public class PharmacyImportCatalogMatcher {

    private final ProductRepository productRepository;
    private final ProductBarcodeRepository productBarcodeRepository;

    public Optional<Product> findExisting(Integer companyId, String barcode) {
        if (companyId == null || !StringUtils.hasText(barcode)) {
            return Optional.empty();
        }
        List<String> candidates = new ArrayList<>(PharmacyBarcodeVariants.of(barcode));
        if (candidates.isEmpty()) {
            candidates.add(barcode.trim());
        }
        Product primary = matchPrimary(companyId, candidates);
        if (primary != null) {
            return Optional.of(primary);
        }
        return Optional.ofNullable(matchExtra(companyId, candidates));
    }

    /** Есть ли уже этот штрихкод у компании (в т.ч. дубликаты) — для create без NonUniqueResult. */
    public boolean barcodeTaken(Integer companyId, String barcode) {
        if (companyId == null || !StringUtils.hasText(barcode)) {
            return false;
        }
        String value = barcode.trim();
        if (!productRepository.findByCompanyIdAndBarcodeIn(companyId, List.of(value)).isEmpty()) {
            return true;
        }
        for (ProductBarcode row : productBarcodeRepository.findByBarcodeIn(List.of(value))) {
            Optional<Product> owner = productRepository.findById(row.getProductId());
            if (owner.isPresent() && companyId.equals(owner.get().getCompanyId())) {
                return true;
            }
        }
        return false;
    }

    private Product matchPrimary(Integer companyId, List<String> candidates) {
        List<Product> hits = productRepository.findByCompanyIdAndBarcodeIn(companyId, candidates);
        if (hits.isEmpty()) {
            return null;
        }
        return preferActive(hits);
    }

    private Product matchExtra(Integer companyId, List<String> candidates) {
        List<ProductBarcode> rows = productBarcodeRepository.findByBarcodeIn(candidates);
        if (rows.isEmpty()) {
            return null;
        }
        Map<String, UUID> productIdByBarcode = new HashMap<>();
        for (ProductBarcode row : rows) {
            productIdByBarcode.putIfAbsent(row.getBarcode(), row.getProductId());
        }
        Set<UUID> ids = new HashSet<>(productIdByBarcode.values());
        List<Product> owned = new ArrayList<>();
        for (Product product : productRepository.findAllById(ids)) {
            if (companyId.equals(product.getCompanyId())) {
                owned.add(product);
            }
        }
        if (owned.isEmpty()) {
            return null;
        }
        for (String candidate : candidates) {
            UUID productId = productIdByBarcode.get(candidate);
            if (productId == null) {
                continue;
            }
            for (Product product : owned) {
                if (productId.equals(product.getId())) {
                    return product;
                }
            }
        }
        return preferActive(owned);
    }

    private static Product preferActive(List<Product> products) {
        return products.stream()
            .sorted(Comparator
                .comparing(Product::isActive).reversed()
                .thenComparing(p -> p.getName() == null ? "" : p.getName()))
            .findFirst()
            .orElse(products.get(0));
    }
}
