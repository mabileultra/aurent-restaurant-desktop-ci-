package com.pos.catalog.service.product.support;

import com.pos.catalog.dto.ref.WeightProductRef;
import com.pos.catalog.entity.Product;
import com.pos.catalog.mapper.ProductRefMapper;
import com.pos.catalog.repository.ProductRepository;
import com.pos.domain.SaleType;
import com.pos.exception.PosExceptions;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CatalogWeightProductSupport {

    private final ProductRepository productRepository;
    private final ProductCatalogLoader catalogLoader;
    private final ProductPluValidator pluValidator;
    private final ProductRefMapper productRefMapper;
    private final TenantAccessSupport tenantAccess;

    @Transactional(readOnly = true)
    public List<WeightProductRef> listActive(Integer companyId) {
        return productRepository.findActiveByCompanyAndSaleType(companyId, SaleType.WEIGHT).stream()
            .map(productRefMapper::toWeightRef)
            .toList();
    }

    @Transactional(readOnly = true)
    public Optional<WeightProductRef> findActiveByPlu(Integer companyId, String plu) {
        String normalized = pluValidator.requireNormalized(plu);
        return productRepository.findByCompany_IdAndPlu(companyId, normalized)
            .filter(Product::isActive)
            .filter(p -> p.getSaleType() == SaleType.WEIGHT)
            .map(productRefMapper::toWeightRef);
    }

    @Transactional(readOnly = true)
    public WeightProductRef requireActiveByPlu(Integer companyId, String plu) {
        String normalized = pluValidator.requireNormalized(plu);
        Product product = productRepository.findByCompany_IdAndPlu(companyId, normalized)
            .orElseThrow(() -> PosExceptions.notFound("Product for PLU", normalized));
        if (!product.isActive()) {
            throw PosExceptions.badRequest("Product is not active");
        }
        if (product.getSaleType() != SaleType.WEIGHT) {
            throw PosExceptions.badRequest("Product is not a weight item", "saleType", product.getSaleType());
        }
        return productRefMapper.toWeightRef(product);
    }

    @Transactional
    public WeightProductRef assignPlu(UUID productId, String rawPlu) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Product product = catalogLoader.requireDetailed(productId);
        tenantAccess.assertProductBelongsToTenant(product);
        if (product.getSaleType() != SaleType.WEIGHT) {
            throw PosExceptions.badRequest("Only WEIGHT products can have PLU", "saleType", product.getSaleType());
        }

        String plu = pluValidator.normalizeOrNull(rawPlu);
        if (plu != null) {
            productRepository.findByCompany_IdAndPlu(companyId, plu)
                .filter(other -> !other.getId().equals(product.getId()))
                .ifPresent(other -> {
                    throw PosExceptions.conflict("PLU already in use", "plu", plu);
                });
        }
        product.setPlu(plu);
        Product saved = productRepository.save(product);
        LogUtil.info(CatalogWeightProductSupport.class, "PLU assigned: productId={}, plu={}", saved.getId(), plu);
        return productRefMapper.toWeightRef(saved);
    }
}
