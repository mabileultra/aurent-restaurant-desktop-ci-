package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.catalog.dto.CreateProductRequest;
import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.catalog.dto.UpdateProductRequest;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.support.PharmacyBarcodeClaim;
import com.pos.pharmacy.catalog.support.ProductExtraBarcodeWriter;
import com.pos.pharmacy.catalog.support.ProductResponseFactory;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.domain.ProductType;
import com.pos.pharmacy.domain.SaleType;
import com.pos.pharmacy.domain.UnitCode;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCatalogErrors;
import com.pos.pharmacy.support.PharmacyDbFieldLimits;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductWriteService {

    private final ProductRepository productRepository;
    private final ProductAttributeService productAttributeService;
    private final StoreStockService storeStockService;
    private final PharmacyBarcodeClaim barcodeClaim;
    private final ProductExtraBarcodeWriter extraBarcodeWriter;
    private final ProductDeactivateService productDeactivateService;
    private final TenantSupport tenant;
    private final ProductFiscalFieldsApplier fiscalFields;
    private final ProductResponseFactory responseFactory;
    private final PharmacyCatalogCacheEvictor catalogCacheEvictor;

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        Integer companyId = tenant.requireCompanyId();
        if (productRepository.findByCompanyIdAndSku(companyId, req.sku()).filter(Product::isActive).isPresent()) {
            throw PharmacyErrors.of(PharmacyCatalogErrors.PHARM_SKU_EXISTS, "sku", req.sku());
        }
        barcodeClaim.claim(companyId, req.barcode());
        productRepository.findByCompanyIdAndSku(companyId, req.sku()).filter(existing -> !existing.isActive())
            .ifPresent(inactive -> {
                barcodeClaim.release(inactive);
                productRepository.saveAndFlush(inactive);
            });
        Product product = Product.builder()
            .companyId(companyId)
            .sku(req.sku().trim())
            .name(req.name().trim())
            .description(req.description())
            .categoryId(req.categoryId())
            .costPrice(scale(req.costPrice()))
            .sellingPrice(scale(req.sellingPrice()))
            .defaultDiscountPercent(req.defaultDiscountPercent() != null ? req.defaultDiscountPercent() : BigDecimal.ZERO)
            .taxRate(ProductTaxBulkService.taxRate(req.taxRate()))
            .productType(req.productType() != null ? req.productType() : ProductType.RETAIL)
            .saleType(req.saleType() != null ? req.saleType() : SaleType.PIECE)
            .unitCode(req.unitCode() != null ? req.unitCode() : UnitCode.PCS)
            .quantityScale(req.quantityScale() != null ? req.quantityScale() : 0)
            .allowFraction(Boolean.TRUE.equals(req.allowFraction()))
            .lowStockAlert(req.lowStockAlert() != null ? req.lowStockAlert() : 10)
            .barcode(trim(req.barcode()))
            .plu(trim(req.plu()))
            .imageUrl(req.imageUrl())
            .externalProductId(req.externalProductId())
            .ikpu(PharmacyDbFieldLimits.ikpu(req.ikpu()))
            .ikpuStatus(req.ikpuStatus() != null
                ? PharmacyDbFieldLimits.ikpuStatus(req.ikpuStatus())
                : "UNKNOWN")
            .unitOfMeasure(req.unitOfMeasure())
            .unitMeasureCode(req.unitMeasureCode())
            .packageCode(PharmacyDbFieldLimits.packageCode(req.packageCode()))
            .soldIndividually(req.soldIndividually() == null || req.soldIndividually())
            .markedProduct(Boolean.TRUE.equals(req.markedProduct()))
            .storageLocation(req.storageLocation())
            .ownerType(req.ownerType())
            .commissionTin(req.commissionTin())
            .commissionPinfl(req.commissionPinfl())
            .uzInvoiceDocumentId(req.uzInvoiceDocumentId())
            .build();
        Product saved = productRepository.save(product);
        extraBarcodeWriter.replace(saved.getId(), companyId, saved.getBarcode(), req.additionalBarcodes());
        productAttributeService.saveAttributes(saved.getId(), req.attributes());
        if (req.initialStock() != null && req.initialStock().compareTo(BigDecimal.ZERO) > 0
            && req.storePrices() != null && !req.storePrices().isEmpty()) {
            storeStockService.increase(saved, req.storePrices().get(0).storeId(), req.initialStock());
            productRepository.save(saved);
        }
        catalogCacheEvictor.onProductChanged(companyId);
        return responseFactory.toResponse(saved, null);
    }

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest req) {
        Product product = requireOwned(id);
        if (StringUtils.hasText(req.name())) {
            product.setName(req.name().trim());
        }
        if (req.description() != null) {
            product.setDescription(req.description());
        }
        if (req.categoryId() != null) {
            product.setCategoryId(req.categoryId());
        }
        if (req.costPrice() != null) {
            product.setCostPrice(scale(req.costPrice()));
        }
        if (req.sellingPrice() != null) {
            product.setSellingPrice(scale(req.sellingPrice()));
        }
        if (req.defaultDiscountPercent() != null) {
            product.setDefaultDiscountPercent(req.defaultDiscountPercent());
        }
        if (req.taxRate() != null) {
            product.setTaxRate(ProductTaxBulkService.taxRate(req.taxRate()));
        }
        if (req.productType() != null) {
            product.setProductType(req.productType());
        }
        if (req.saleType() != null) {
            product.setSaleType(req.saleType());
        }
        if (req.unitCode() != null) {
            product.setUnitCode(req.unitCode());
        }
        if (req.quantityScale() != null) {
            product.setQuantityScale(req.quantityScale());
        }
        if (req.allowFraction() != null) {
            product.setAllowFraction(req.allowFraction());
        }
        if (req.lowStockAlert() != null) {
            product.setLowStockAlert(req.lowStockAlert());
        }
        if (req.barcode() != null) {
            String barcode = trim(req.barcode());
            barcodeClaim.claim(product.getCompanyId(), barcode, product.getId());
            product.setBarcode(barcode);
        }
        if (req.plu() != null) {
            product.setPlu(trim(req.plu()));
        }
        if (req.imageUrl() != null) {
            product.setImageUrl(req.imageUrl());
        }
        if (req.attributes() != null) {
            productAttributeService.saveAttributes(product.getId(), req.attributes());
        }
        fiscalFields.apply(product, req);
        extraBarcodeWriter.replace(
            product.getId(),
            product.getCompanyId(),
            product.getBarcode(),
            req.additionalBarcodes()
        );
        if (Boolean.FALSE.equals(req.active())) {
            productDeactivateService.deactivate(product);
        } else if (Boolean.TRUE.equals(req.active())) {
            product.setActive(true);
        }
        Product saved = productRepository.save(product);
        catalogCacheEvictor.onProductChanged(saved.getCompanyId());
        return responseFactory.toResponse(saved, null);
    }

    @Transactional(readOnly = true)
    public Product requireOwned(UUID id) {
        Integer companyId = tenant.requireCompanyId();
        return productRepository.findById(id)
            .filter(p -> p.getCompanyId().equals(companyId))
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacyCatalogErrors.PHARM_PRODUCT_NOT_FOUND, id));
    }

    @Transactional(readOnly = true)
    public Product requireActive(UUID id) {
        Product product = requireOwned(id);
        if (!product.isActive()) {
            throw PharmacyErrors.of(PharmacyCatalogErrors.PHARM_PRODUCT_NOT_ACTIVE);
        }
        return product;
    }

    private static BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private static String trim(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
