package com.pos.catalog.api.impl;

import com.pos.catalog.api.CatalogFacade;
import com.pos.catalog.api.support.CatalogRemoteReadBridge;
import com.pos.catalog.dto.ref.ProductRef;
import com.pos.catalog.dto.ref.WeightProductRef;
import com.pos.catalog.mapper.ProductRefMapper;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.product.support.CatalogProductBarcodeFinder;
import com.pos.catalog.service.product.support.CatalogProductSearchSupport;
import com.pos.catalog.service.product.support.CatalogWeightProductSupport;
import com.pos.exception.PosExceptions;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatalogFacadeImpl implements CatalogFacade {

    private final ProductRepository productRepository;
    private final CatalogProductBarcodeFinder barcodeFinder;
    private final CatalogProductSearchSupport productSearchSupport;
    private final CatalogWeightProductSupport weightProductSupport;
    private final ProductRefMapper productRefMapper;
    private final CatalogRemoteReadBridge remoteReadBridge;

    @Override
    public ProductRef getById(UUID productId) {
        return remoteReadBridge.getById(
                productId,
                () -> productRepository.findById(productId).map(productRefMapper::toRef)
            )
            .orElseThrow(() -> {
                LogUtil.warn(CatalogFacadeImpl.class, "CatalogFacade getById miss productId={}", productId);
                return PosExceptions.notFound("Product", productId);
            });
    }

    @Override
    public Optional<ProductRef> findByBarcode(Integer companyId, String barcode) {
        return remoteReadBridge.findByBarcode(
            companyId,
            barcode,
            () -> barcodeFinder.find(companyId, barcode).map(productRefMapper::toRef)
        );
    }

    @Override
    public List<ProductRef> searchActiveProducts(
        Integer companyId,
        String searchText,
        String barcodeExact,
        int limit
    ) {
        // barcodeExact is local-only nuance; remote search uses searchText (incl. exact barcode match).
        String q = (searchText != null && !searchText.isBlank())
            ? searchText
            : (barcodeExact != null ? barcodeExact : "");
        return remoteReadBridge.searchActive(
            companyId,
            q,
            limit,
            () -> productSearchSupport.searchActive(companyId, searchText, barcodeExact, limit)
        );
    }

    @Override
    public Optional<ProductRef> findActiveById(UUID productId, Integer companyId) {
        return remoteReadBridge.findActiveById(
            productId,
            companyId,
            () -> productSearchSupport.findActiveById(productId, companyId)
        );
    }

    @Override
    public ProductRef requireActiveById(UUID productId, Integer companyId) {
        return findActiveById(productId, companyId)
            .orElseThrow(() -> PosExceptions.notFound("Product", productId));
    }

    @Override
    public List<WeightProductRef> listActiveWeightProducts(Integer companyId) {
        return weightProductSupport.listActive(companyId);
    }

    @Override
    public Optional<WeightProductRef> findActiveWeightByPlu(Integer companyId, String plu) {
        return weightProductSupport.findActiveByPlu(companyId, plu);
    }

    @Override
    public WeightProductRef requireActiveWeightByPlu(Integer companyId, String plu) {
        return weightProductSupport.requireActiveByPlu(companyId, plu);
    }

    @Override
    public WeightProductRef assignWeightPlu(UUID productId, String plu) {
        return weightProductSupport.assignPlu(productId, plu);
    }
}
