package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.cache.PharmacyProductBarcodeCache;
import com.pos.pharmacy.catalog.dto.BulkProductIdsRequest;
import com.pos.pharmacy.catalog.dto.BulkTaxRateRequest;
import com.pos.pharmacy.catalog.dto.CreateProductRequest;
import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.catalog.dto.UpdateProductRequest;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.support.ProductListResponseAssembler;
import com.pos.pharmacy.catalog.support.ProductResponseFactory;
import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCatalogErrors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductCatalogService {

    private final ProductRepository productRepository;
    private final TenantSupport tenant;
    private final ProductListResponseAssembler listResponseAssembler;
    private final PharmacyProductBarcodeCache productBarcodeCache;
    private final ProductBarcodeLookupService barcodeLookupService;
    private final ProductResponseFactory responseFactory;
    private final ProductWriteService productWriteService;
    private final ProductDeactivateService productDeactivateService;
    private final ProductTaxBulkService productTaxBulkService;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> list(String search, Boolean active, Integer storeId, Pageable pageable) {
        Integer companyId = tenant.requireCompanyId();
        Page<Product> page = productRepository.search(companyId, trim(search), active, pageable);
        List<ProductResponse> content = listResponseAssembler.assemble(page.getContent(), storeId);
        return new PageResponse<>(
            content,
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.getNumber()
        );
    }

    @Transactional(readOnly = true)
    public ProductResponse get(UUID id, Integer storeId) {
        return responseFactory.toResponse(productWriteService.requireOwned(id), storeId);
    }

    @Transactional(readOnly = true)
    public ProductResponse getByBarcode(String barcode, Integer storeId) {
        Integer companyId = tenant.requireCompanyId();
        return productBarcodeCache.getOrLoad(
            companyId,
            storeId,
            barcode,
            () -> loadByBarcode(companyId, barcode, storeId)
        );
    }

    public ProductResponse create(CreateProductRequest req) {
        return productWriteService.create(req);
    }

    public ProductResponse update(UUID id, UpdateProductRequest req) {
        return productWriteService.update(id, req);
    }

    public int bulkUpdateTaxRate(BulkTaxRateRequest req) {
        return productTaxBulkService.bulkUpdateTaxRate(req);
    }

    public void deactivate(UUID id) {
        productDeactivateService.deactivate(id);
    }

    public int bulkDeactivate(BulkProductIdsRequest req) {
        return productDeactivateService.bulkDeactivate(req);
    }

    @Transactional(readOnly = true)
    public Product requireActive(UUID id) {
        return productWriteService.requireActive(id);
    }

    private ProductResponse loadByBarcode(Integer companyId, String barcode, Integer storeId) {
        Product product = barcodeLookupService.findByScan(companyId, barcode);
        if (!product.isActive()) {
            throw PharmacyErrors.of(PharmacyCatalogErrors.PHARM_PRODUCT_NOT_ACTIVE);
        }
        return responseFactory.toResponse(product, storeId);
    }

    private static String trim(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
