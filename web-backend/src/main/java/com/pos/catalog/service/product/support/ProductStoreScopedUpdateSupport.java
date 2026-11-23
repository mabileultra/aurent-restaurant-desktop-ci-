package com.pos.catalog.service.product.support;

import com.pos.catalog.dto.product.UpdateProductRequest;
import com.pos.catalog.entity.Category;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.CategoryRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.UnitCatalogService;
import com.pos.catalog.service.product.ProductExtensionService;
import com.pos.catalog.service.product.ProductQuantityRulesResolver;
import com.pos.catalog.service.product.SaleTypeSupport;
import com.pos.exception.PosExceptions;
import com.pos.service.businessconfig.support.StoreBusinessTypeResolver;
import com.pos.service.support.ProductValueNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Applies shared card fields + price for one store only (no company-wide price broadcast).
 */
@Component
@RequiredArgsConstructor
public class ProductStoreScopedUpdateSupport {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductBarcodeValidator barcodeValidator;
    private final ProductPluValidator pluValidator;
    private final ProductStorePriceApplier storePriceApplier;
    private final ProductExtensionService extensionService;
    private final UnitCatalogService unitCatalogService;
    private final StoreBusinessTypeResolver storeBusinessTypeResolver;

    public void apply(Product product, UpdateProductRequest req, Integer storeId) {
        applyCardFields(product, req);
        storePriceApplier.applySellingPriceForStore(
            product, storeId, req.sellingPrice(), req.storePrices()
        );
        extensionService.applyOnUpdate(product, req);
    }

    private void applyCardFields(Product product, UpdateProductRequest req) {
        if (StringUtils.hasText(req.name())) {
            product.setName(req.name());
        }
        if (req.description() != null) {
            product.setDescription(req.description());
        }
        if (req.costPrice() != null) {
            product.setCostPrice(req.costPrice());
        }
        if (req.defaultDiscountPercent() != null) {
            product.setDefaultDiscountPercent(ProductValueNormalizer.discountPercent(req.defaultDiscountPercent()));
        }
        if (req.taxRate() != null) {
            product.setTaxRate(ProductValueNormalizer.taxRatePercent(req.taxRate()));
        }
        if (req.saleType() != null || req.unitCode() != null || req.quantityScale() != null || req.allowFraction() != null) {
            ProductQuantityRulesResolver.applyTo(
                product,
                req.saleType() != null ? req.saleType() : product.getSaleType(),
                req.unitCode(),
                req.quantityScale(),
                req.allowFraction(),
                req.unitOfMeasure() != null ? req.unitOfMeasure() : product.getUnitOfMeasure()
            );
            if (req.unitOfMeasure() == null) {
                product.setUnitOfMeasure(SaleTypeSupport.defaultUnitOfMeasure(product.getSaleType(), null));
            }
            unitCatalogService.requireStockUnit(product.getUnitCode());
        }
        if (req.lowStockAlert() != null) {
            product.setLowStockAlert(req.lowStockAlert());
        }
        if (StringUtils.hasText(req.imageUrl())) {
            product.setImageUrl(req.imageUrl());
        }
        if (req.categoryId() != null) {
            Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> PosExceptions.notFound("Category", req.categoryId()));
            product.setCategory(category);
        }
        if (req.externalProductId() != null) {
            product.setExternalProductId(req.externalProductId());
        }
        if (req.ikpu() != null) {
            product.setIkpu(req.ikpu());
        }
        if (req.ikpuStatus() != null) {
            product.setIkpuStatus(req.ikpuStatus());
        }
        if (req.unitOfMeasure() != null) {
            product.setUnitOfMeasure(req.unitOfMeasure());
        }
        if (req.unitMeasureCode() != null) {
            product.setUnitMeasureCode(req.unitMeasureCode());
        }
        if (req.packageCode() != null) {
            product.setPackageCode(req.packageCode());
        }
        if (req.storageLocation() != null) {
            product.setStorageLocation(StringUtils.hasText(req.storageLocation()) ? req.storageLocation().trim() : null);
        }
        // Branch scope: never flip company-wide active from a store-filtered edit.
        if (req.ownerType() != null) {
            product.setOwnerType(req.ownerType());
        }
        if (req.commissionTin() != null) {
            product.setCommissionTin(req.commissionTin());
        }
        if (req.commissionPinfl() != null) {
            product.setCommissionPinfl(req.commissionPinfl());
        }
        if (req.barcode() != null) {
            barcodeValidator.assertUnique(product.getCompany().getId(), req.barcode(), product.getId());
            product.setBarcode(req.barcode());
        }
        if (req.plu() != null) {
            String plu = pluValidator.normalizeOrNull(req.plu());
            if (plu != null) {
                productRepository.findByCompany_IdAndPlu(product.getCompany().getId(), plu)
                    .filter(other -> !other.getId().equals(product.getId()))
                    .ifPresent(other -> {
                        throw PosExceptions.conflict("PLU already in use", "plu", plu);
                    });
            }
            product.setPlu(plu);
        }
        if (req.additionalBarcodes() != null) {
            String primary = product.getBarcode();
            barcodeValidator.validateForUpdate(
                product.getCompany().getId(), primary, req.additionalBarcodes(), product.getId()
            );
            storePriceApplier.applyExtraBarcodes(product, req.additionalBarcodes(), primary);
        }
        if (StringUtils.hasText(req.businessTypeCode())) {
            product.setBusinessType(
                storeBusinessTypeResolver.resolveForUpdate(
                    product.getCompany().getId(), null, req.businessTypeCode()
                )
            );
        }
    }
}
