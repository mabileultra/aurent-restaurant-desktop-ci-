package com.pos.catalog.service.product.impl;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductBarcode;
import com.pos.exception.PosExceptions;
import com.pos.catalog.repository.ProductBarcodeRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.catalog.repository.spec.ProductSpecifications;
import com.pos.catalog.service.product.ProductQueryService;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.catalog.service.product.support.ProductCatalogLoader;
import com.pos.catalog.service.product.support.ProductLowStockQuerySupport;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.scales.codec.WeightBarcodeCodec;
import com.pos.service.support.ProductLookupSupport;
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
    private final ProductStorePriceRepository productStorePriceRepository;
    private final ProductCatalogLoader catalogLoader;
    private final ProductResponseAssembler assembler;
    private final StoreStockService storeStockService;
    private final ProductLowStockQuerySupport productLowStockQuerySupport;
    private final TenantAccessSupport tenantAccess;
    private final WeightBarcodeCodec weightBarcodeCodec;

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
        Pageable pageable
    ) {
        String scope = deletedScope != null ? deletedScope : (activeOnly ? "ACTIVE" : "ALL");
        Specification<Product> spec = ProductSpecifications.catalogFilter(
            tenantAccess.effectiveCompanyIdOrNull(),
            search, categoryId, scope, storeId, ikpuStatus, markedProduct, soldIndividually, barcodeExact,
            attributeFilters
        );
        return mapPage(productRepository.findAll(spec, pageable), storeId);
    }

    @Override
    public PageResponse<ProductResponse> getWarehouseProducts(
        String search,
        String barcodeContains,
        Boolean markedProduct,
        Pageable pageable
    ) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Specification<Product> spec = ProductSpecifications.warehouseFilter(
            companyId, search, barcodeContains, markedProduct
        );
        return mapPage(productRepository.findAll(spec, pageable), null);
    }

    @Override
    public ProductResponse getProduct(UUID id, Integer storeId) {
        Product product = catalogLoader.requireDetailed(id);
        tenantAccess.assertProductBelongsToTenant(product);
        return forStore(assembler.toResponse(product), product, storeId);
    }

    @Override
    public ProductResponse getByBarcode(String barcode) {
        return assembler.toResponse(validateBarcodeProduct(resolveByBarcode(barcode), null));
    }

    @Override
    public ProductResponse getByBarcode(String barcode, Integer storeId) {
        Product product = validateBarcodeProduct(resolveByBarcode(barcode), storeId);
        return forStore(assembler.toResponse(product), product, storeId);
    }

    @Override
    public List<ProductResponse> getLowStockProducts() {
        tenantAccess.requireEffectiveCompanyId();
        return productLowStockQuerySupport.list(500);
    }

    private PageResponse<ProductResponse> mapPage(Page<Product> page, Integer storeId) {
        List<Product> content = page.getContent();
        content.forEach(catalogLoader::initCollections);
        Map<UUID, Integer> storeCounts = catalogLoader.loadStoreCounts(content);
        Map<UUID, Integer> dispatched = assembler.loadDispatchedCounts(content);
        if (storeId == null) {
            return PageResponse.from(page.map(p -> assembler.toResponse(p, storeCounts, dispatched)));
        }
        Map<UUID, BigDecimal> storeQty = storeStockService.getQuantities(
            content.stream().map(Product::getId).toList(),
            storeId
        );
        return PageResponse.from(page.map(p -> {
            ProductResponse base = assembler.toResponse(p, storeCounts, dispatched);
            BigDecimal qty = storeQty.getOrDefault(p.getId(), BigDecimal.ZERO);
            ProductResponse withQty = assembler.withStockQuantity(base, qty);
            BigDecimal price = productStorePriceRepository
                .findByProduct_IdAndStore_Id(p.getId(), storeId)
                .map(sp -> sp.getPrice())
                .orElse(p.getSellingPrice());
            return assembler.withSellingPrice(withQty, price);
        }));
    }

    private ProductResponse forStore(ProductResponse base, Product product, Integer storeId) {
        if (storeId == null) {
            return base;
        }
        BigDecimal qty = storeStockService.getQuantity(product.getId(), storeId);
        ProductResponse withQty = assembler.withStockQuantity(base, qty);
        BigDecimal price = productStorePriceRepository
            .findByProduct_IdAndStore_Id(product.getId(), storeId)
            .map(sp -> sp.getPrice())
            .orElse(product.getSellingPrice());
        return assembler.withSellingPrice(withQty, price);
    }

    private Product validateBarcodeProduct(Product product, Integer storeId) {
        if (!product.isActive()) {
            throw PosExceptions.badRequest("Product is not active");
        }
        if (storeId != null
            && productStorePriceRepository.findByProduct_IdAndStore_Id(product.getId(), storeId).isEmpty()) {
            throw PosExceptions.badRequest("Product is not available in this store");
        }
        return product;
    }

    private Product resolveByBarcode(String barcode) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Optional<Product> primary = productLookup.findOne(
            ProductSpecifications.lookup(companyId).barcode(barcode).anyActiveState()
        );
        if (primary.isPresent()) {
            return primary.get();
        }
        Optional<Product> extra = productBarcodeRepository.findByBarcodeAndProductCompanyId(barcode, companyId)
            .map(ProductBarcode::getProduct);
        if (extra.isPresent()) {
            return extra.get();
        }
        return weightBarcodeCodec.tryDecode(barcode)
            .flatMap(decoded -> productRepository.findByCompany_IdAndPlu(companyId, decoded.plu()))
            .orElseThrow(() -> PosExceptions.notFound("Product for barcode", barcode));
    }
}
