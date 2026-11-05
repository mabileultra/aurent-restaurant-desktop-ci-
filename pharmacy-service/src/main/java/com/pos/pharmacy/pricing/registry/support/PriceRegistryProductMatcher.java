package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.entity.ProductBarcode;
import com.pos.pharmacy.catalog.repository.ProductBarcodeRepository;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.pricing.registry.domain.PriceRegistryMatchBy;
import com.pos.pharmacy.pricing.registry.dto.RegistryParsedRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** Match registry row → pharmacy product by barcode, then Pharm ID (externalProductId). */
@Component
@RequiredArgsConstructor
public class PriceRegistryProductMatcher {

    private final ProductRepository productRepository;
    private final ProductBarcodeRepository productBarcodeRepository;

    public MatchResult match(Integer companyId, RegistryParsedRow row) {
        if (row.barcode() != null && !row.barcode().isBlank()) {
            Optional<Product> byBarcode = productRepository
                .findByCompanyIdAndBarcode(companyId, row.barcode());
            if (byBarcode.isPresent()) {
                return new MatchResult(byBarcode.get(), PriceRegistryMatchBy.BARCODE);
            }
            Optional<ProductBarcode> alias = productBarcodeRepository.findByBarcode(row.barcode());
            if (alias.isPresent()) {
                Optional<Product> product = productRepository.findById(alias.get().getProductId())
                    .filter(p -> companyId.equals(p.getCompanyId()));
                if (product.isPresent()) {
                    return new MatchResult(product.get(), PriceRegistryMatchBy.BARCODE);
                }
            }
        }
        if (row.pharmId() != null && !row.pharmId().isBlank()) {
            Optional<Product> byPharm = productRepository
                .findFirstByCompanyIdAndExternalProductId(companyId, row.pharmId());
            if (byPharm.isPresent()) {
                return new MatchResult(byPharm.get(), PriceRegistryMatchBy.PHARM_ID);
            }
        }
        return new MatchResult(null, PriceRegistryMatchBy.NONE);
    }

    public record MatchResult(Product product, PriceRegistryMatchBy matchedBy) {}
}
