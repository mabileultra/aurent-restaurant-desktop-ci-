package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCatalogErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCommonErrors;
import com.pos.pharmacy.pricing.registry.entity.PriceRegistryRow;
import com.pos.pharmacy.pricing.registry.entity.PriceRegistrySnapshot;
import com.pos.pharmacy.pricing.registry.exception.PriceLimitExceededException;
import com.pos.pharmacy.pricing.registry.repository.PriceRegistryRowRepository;
import com.pos.pharmacy.pricing.registry.repository.PriceRegistrySnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Касса: checkPriceBeforeSale — запрет продажи выше предела госреестра.
 */
@Component
@RequiredArgsConstructor
public class PriceLimitSaleValidator {

    private final ProductRepository productRepository;
    private final PriceRegistrySnapshotRepository snapshotRepository;
    private final PriceRegistryRowRepository rowRepository;

    @Transactional(readOnly = true)
    public boolean checkPriceBeforeSale(UUID productId, BigDecimal salePrice) {
        if (productId == null || salePrice == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_COMPANY_REQUIRED);
        }
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacyCatalogErrors.PHARM_PRODUCT_NOT_FOUND, productId));
        Optional<BigDecimal> limit = resolveLimit(product);
        if (limit.isEmpty()) {
            return true;
        }
        if (salePrice.compareTo(limit.get()) > 0) {
            throw new PriceLimitExceededException(productId, salePrice, limit.get());
        }
        return true;
    }

    private Optional<BigDecimal> resolveLimit(Product product) {
        PriceRegistrySnapshot snap = snapshotRepository
            .findFirstByStatusOrderByCreatedAtDesc("READY")
            .orElse(null);
        if (snap == null) {
            return Optional.empty();
        }
        if (product.getBarcode() != null && !product.getBarcode().isBlank()) {
            Optional<PriceRegistryRow> byBarcode = rowRepository
                .findFirstBySnapshotIdAndBarcode(snap.getId(), product.getBarcode());
            if (byBarcode.isPresent()) {
                return Optional.ofNullable(byBarcode.get().getLimitPriceVat());
            }
        }
        if (product.getExternalProductId() != null && !product.getExternalProductId().isBlank()) {
            List<PriceRegistryRow> byPharm = rowRepository
                .findBySnapshotIdAndPharmId(snap.getId(), product.getExternalProductId());
            if (!byPharm.isEmpty()) {
                return byPharm.stream()
                    .map(PriceRegistryRow::getLimitPriceVat)
                    .filter(p -> p != null)
                    .min(BigDecimal::compareTo);
            }
        }
        return Optional.empty();
    }
}
