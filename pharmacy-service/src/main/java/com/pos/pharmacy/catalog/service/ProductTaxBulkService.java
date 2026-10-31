package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.catalog.dto.BulkTaxRateRequest;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCatalogErrors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductTaxBulkService {

    private final ProductRepository productRepository;
    private final TenantSupport tenant;
    private final PharmacyCatalogCacheEvictor catalogCacheEvictor;

    @Transactional
    public int bulkUpdateTaxRate(BulkTaxRateRequest req) {
        Integer companyId = tenant.requireCompanyId();
        List<Product> products = productRepository.findAllById(req.productIds()).stream()
            .filter(p -> p.getCompanyId().equals(companyId))
            .toList();
        if (products.isEmpty()) {
            throw PharmacyErrors.of(PharmacyCatalogErrors.PHARM_PRODUCTS_NOT_FOUND);
        }
        BigDecimal tax = taxRate(req.taxRate());
        products.forEach(p -> p.setTaxRate(tax));
        productRepository.saveAll(products);
        catalogCacheEvictor.onProductChanged(companyId);
        return products.size();
    }

    static BigDecimal taxRate(BigDecimal value) {
        if (value == null) {
            return new BigDecimal("12");
        }
        BigDecimal scaled = value.setScale(2, RoundingMode.HALF_UP);
        BigDecimal max = new BigDecimal("999.99");
        if (scaled.abs().compareTo(max) > 0) {
            return scaled.signum() < 0 ? max.negate() : max;
        }
        return scaled;
    }
}
