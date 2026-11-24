package com.pos.catalog.service.product.impl;

import com.pos.catalog.api.support.CatalogRemoteReadinessGuard;
import com.pos.catalog.dto.product.ProductCatalogTotalsResponse;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductBarcode;
import com.pos.exception.PosExceptions;
import com.pos.catalog.repository.ProductBarcodeRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.spec.ProductCategoryScopeSpecifications;
import com.pos.catalog.repository.spec.ProductSpecifications;
import com.pos.catalog.repository.spec.ProductStoreAssortmentSpecifications;
import com.pos.catalog.service.product.ProductQueryService;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.catalog.service.product.support.ProductBarcodeScanVariants;
import com.pos.catalog.service.product.support.ProductCatalogLoader;
import com.pos.catalog.service.product.support.ProductCatalogTotalsSupport;
import com.pos.catalog.service.product.support.ProductLowStockQuerySupport;
import com.pos.catalog.service.product.support.ProductSearchMarkingNormalizer;
import com.pos.catalog.service.product.support.ProductStoreScopedResponseSupport;
import com.pos.catalog.service.product.support.ProductWarehouseReceiptSupport;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.sales.support.CashRegisterCategoryScopeResolver;
import com.pos.scales.codec.WeightBarcodeCodec;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.catalog.service.product.support.ProductLookupSupport;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductQueryServiceImpl implements ProductQueryService {

    private final ProductRepository productRepository;
    private final ProductLookupSupport productLookup;
    private final ProductBarcodeRepository productBarcodeRepository;
    private final ProductCatalogLoader catalogLoader;
    private final ProductResponseAssembler assembler;
    private final StoreStockService storeStockService;
    private final ProductLowStockQuerySupport productLowStockQuerySupport;
    private final ProductCatalogTotalsSupport productCatalogTotalsSupport;
    private final ProductStoreScopedResponseSupport storeScopedResponse;
    private final TenantAccessSupport tenantAccess;
    private final WeightBarcodeCodec weightBarcodeCodec;
    private final CatalogIsolationSupport catalogIsolation;
    private final CatalogRemoteReadinessGuard catalogRemoteReadinessGuard;
    private final ProductWarehouseReceiptSupport warehouseReceiptSupport;
    private final CashRegisterCategoryScopeResolver cashRegisterCategoryScopeResolver;

    @Override
    public PageResponse<ProductResponse> getProducts(
        String search,
        Integer categoryId,
        boolean activeOnly,
        String deletedScope,
        Integer storeId,
        String ikpuStatus,
        Boolean markedProduct,
        Boolean soldIndividually,
        String barcodeExact,
        java.util.Map<String, String> attributeFilters,
        String businessTypeCode,
        Long cashRegisterId,
        Pageable pageable
    ) {
        catalogRemoteReadinessGuard.requireReachableForRemoteOnlyReads();
        String scope = deletedScope != null ? deletedScope : (activeOnly ? "ACTIVE" : "ALL");
        Specification<Product> spec = ProductSpecifications.catalogFilter(
            tenantAccess.effectiveCompanyIdOrNull(),
            ProductSearchMarkingNormalizer.forSearchOrBarcodeFilter(search),
            categoryId,
            scope,
            storeId,
            ikpuStatus,
            markedProduct,
            soldIndividually,
            ProductSearchMarkingNormalizer.forSearchOrBarcodeFilter(barcodeExact),
            attributeFilters,
            businessTypeCode
        )
            .and(ProductStoreAssortmentSpecifications.presentAtStore(storeId))
            .and(ProductCategoryScopeSpecifications.within(
                cashRegisterCategoryScopeResolver.resolve(storeId, cashRegisterId)
            ));
        return mapPage(productRepository.findAll(spec, pageable), storeId);
    }

    @Override
    public PageResponse<ProductResponse> getCashierStoreProducts(
        Integer storeId,
        Long cashRegisterId,
        Pageable pageable
    ) {
        catalogRemoteReadinessGuard.requireReachableForRemoteOnlyReads();
        if (storeId == null) {
            throw PosExceptions.badRequest("Store is required");
        }
        Specification<Product> spec = ProductSpecifications.catalogFilter(
            tenantAccess.effectiveCompanyIdOrNull(),
            null, null, "ACTIVE", storeId, null, null, null, null, null, null
        )
            .and(ProductStoreAssortmentSpecifications.presentAtStore(storeId))
            .and(ProductCategoryScopeSpecifications.within(
                cashRegisterCategoryScopeResolver.resolve(storeId, cashRegisterId)
            ));
        return mapPage(productRepository.findAll(spec, pageable), storeId);
    }

    @Override
    public PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        String businessTypeCode,
        Integer storeId,
        String receiptNumber,
        Pageable pageable
    ) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        if (storeId != null) {
            storeStockService.requireStoreForCompany(companyId, storeId);
        }
        java.util.List<UUID> receiptProductIds =
            warehouseReceiptSupport.productIdsForReceiptFilter(companyId, receiptNumber);
        Specification<Product> spec = ProductSpecifications.warehouseFilter(
            companyId,
            ProductSearchMarkingNormalizer.forSearchOrBarcodeFilter(search),
            ProductSearchMarkingNormalizer.forSearchOrBarcodeFilter(barcodeContains),
            markedProduct,
            businessTypeCode,
            receiptProductIds
        ).and(ProductStoreAssortmentSpecifications.presentAtStore(storeId));
        PageResponse<ProductResponse> page = mapPage(productRepository.findAll(spec, pageable), storeId);
        java.util.List<ProductResponse> enriched =
            warehouseReceiptSupport.withLatestReceiptNumbers(companyId, page.content());
        return new PageResponse<>(
            enriched,
            page.totalPages(),
            page.totalElements(),
            page.size(),
            page.number()
        );
    }

    @Override
    public ProductResponse getProduct(UUID id, Integer storeId) {
        catalogRemoteReadinessGuard.requireReachableForRemoteOnlyReads();
        Product product = catalogLoader.requireDetailed(id);
        tenantAccess.assertProductBelongsToTenant(product);
        catalogIsolation.hidePharmacyFromGrocery(product);
        return forStore(toResponseScoped(product, storeId), product, storeId);
    }

    @Override
    public ProductResponse getByBarcode(String barcode) {
        catalogRemoteReadinessGuard.requireReachableForRemoteOnlyReads();
        Product product = validateBarcodeProduct(resolveByBarcode(barcode), null);
        catalogIsolation.hidePharmacyFromGrocery(product);
        return forStore(toResponseScoped(product, null), product, null);
    }

    @Override
    public ProductResponse getByBarcode(String barcode, Integer storeId) {
        catalogRemoteReadinessGuard.requireReachableForRemoteOnlyReads();
        Product product = validateBarcodeProduct(resolveByBarcode(barcode), storeId);
        catalogIsolation.hidePharmacyFromGrocery(product);
        return forStore(toResponseScoped(product, storeId), product, storeId);
    }

    private ProductResponse toResponseScoped(Product product, Integer storeId) {
        Map<UUID, Integer> dispatched = assembler.loadDispatchedCounts(List.of(product), storeId);
        return assembler.toResponse(product, null, dispatched);
    }

    @Override
    public List<ProductResponse> getLowStockProducts() {
        return getLowStockProducts(null);
    }

    @Override
    public List<ProductResponse> getLowStockProducts(Integer storeId) {
        tenantAccess.requireEffectiveCompanyId();
        return productLowStockQuerySupport.list(500, storeId);
    }

    @Override
    public ProductCatalogTotalsResponse getCatalogTotals(
        String search,
        Integer categoryId,
        boolean activeOnly,
        String deletedScope,
        Integer storeId,
        String ikpuStatus,
        Boolean markedProduct,
        Boolean soldIndividually,
        String barcodeExact,
        java.util.Map<String, String> attributeFilters,
        String businessTypeCode
    ) {
        catalogRemoteReadinessGuard.requireReachableForRemoteOnlyReads();
        String scope = deletedScope != null ? deletedScope : (activeOnly ? "ACTIVE" : "ALL");
        Specification<Product> spec = ProductSpecifications.catalogFilter(
            tenantAccess.effectiveCompanyIdOrNull(),
            ProductSearchMarkingNormalizer.forSearchOrBarcodeFilter(search),
            categoryId,
            scope,
            storeId,
            ikpuStatus,
            markedProduct,
            soldIndividually,
            ProductSearchMarkingNormalizer.forSearchOrBarcodeFilter(barcodeExact),
            attributeFilters,
            businessTypeCode
        ).and(ProductStoreAssortmentSpecifications.presentAtStore(storeId));
        return productCatalogTotalsSupport.summarize(spec, storeId);
    }

    private PageResponse<ProductResponse> mapPage(Page<Product> page, Integer storeId) {
        List<Product> content = page.getContent();
        content.forEach(catalogLoader::initCollections);
        Map<UUID, Integer> storeCounts = catalogLoader.loadStoreCounts(content);
        Map<UUID, Integer> dispatched = assembler.loadDispatchedCounts(content, storeId);
        if (storeId == null) {
            Map<UUID, BigDecimal> companyQty = storeStockService.sumQuantities(
                content.stream().map(Product::getId).toList()
            );
            return PageResponse.from(page.map(p -> {
                ProductResponse base = assembler.toResponse(p, storeCounts, dispatched);
                // Live company sum from store_stock; missing rows → 0 (not denormalized products.stock_quantity).
                BigDecimal qty = companyQty.getOrDefault(p.getId(), BigDecimal.ZERO);
                return assembler.withStockQuantity(base, qty);
            }));
        }
        Map<UUID, BigDecimal> storeQty = storeScopedResponse.loadStoreQuantities(content, storeId);
        Map<UUID, BigDecimal> storePrices = storeScopedResponse.loadStorePrices(content, storeId);
        return PageResponse.from(page.map(p -> {
            ProductResponse base = assembler.toResponse(p, storeCounts, dispatched);
            return storeScopedResponse.applyStoreScope(base, p, storeId, storeQty, storePrices);
        }));
    }

    private ProductResponse forStore(ProductResponse base, Product product, Integer storeId) {
        if (storeId == null) {
            BigDecimal companyQty = storeStockService.sumQuantities(java.util.List.of(product.getId()))
                .getOrDefault(product.getId(), BigDecimal.ZERO);
            return assembler.withStockQuantity(base, companyQty);
        }
        Map<UUID, BigDecimal> storeQty = Map.of(product.getId(), storeStockService.getQuantity(product.getId(), storeId));
        Map<UUID, BigDecimal> storePrices = storeScopedResponse.loadStorePrices(List.of(product), storeId);
        return storeScopedResponse.applyStoreScope(base, product, storeId, storeQty, storePrices);
    }

    private Product validateBarcodeProduct(Product product, Integer storeId) {
        if (!product.isActive()) {
            throw PosExceptions.badRequest("Product is not active");
        }
        // storeId только для цены/остатка в forStore; отсутствие product_store_prices
        // не блокирует пробитие — берётся sellingPrice.
        return product;
    }

    private Product resolveByBarcode(String barcode) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        for (String code : ProductBarcodeScanVariants.of(barcode)) {
            Optional<Product> primary = productLookup.findOne(
                ProductSpecifications.lookup(companyId).barcode(code).anyActiveState()
            );
            if (primary.isPresent()) {
                return primary.get();
            }
            Optional<Product> extra = productBarcodeRepository.findByBarcodeAndProductCompanyId(code, companyId)
                .map(ProductBarcode::getProduct);
            if (extra.isPresent()) {
                return extra.get();
            }
            // ИКПУ/МХИК часто печатают на этикетке; в barcode поле его не кладём (см. labelBarcode).
            Optional<Product> byIkpu = productLookup.findOne(
                ProductSpecifications.lookup(companyId).ikpu(code).anyActiveState()
            );
            if (byIkpu.isPresent()) {
                return byIkpu.get();
            }
        }
        return weightBarcodeCodec.tryDecode(barcode)
            .flatMap(decoded -> productRepository.findByCompany_IdAndPlu(companyId, decoded.plu()))
            .orElseThrow(() -> PosExceptions.notFound("Product for barcode", barcode));
    }
}
