package com.pos.catalog.service.product.impl;

import com.pos.catalog.dto.product.CreateProductRequest;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.entity.Category;
import com.pos.catalog.entity.Product;
import com.pos.exception.PosExceptions;
import com.pos.catalog.repository.CategoryRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.spec.ProductSpecifications;
import com.pos.catalog.service.ProductAttributeService;
import com.pos.catalog.service.UnitCatalogService;
import com.pos.catalog.service.product.ProductExtensionService;
import com.pos.catalog.service.product.ProductQuantityRulesResolver;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.catalog.service.product.SaleTypeSupport;
import com.pos.catalog.service.product.support.ProductBarcodeValidator;
import com.pos.catalog.service.product.support.ProductInitialStockSupport;
import com.pos.catalog.service.product.support.ProductPluValidator;
import com.pos.catalog.service.product.support.ProductSnapshotNotifier;
import com.pos.catalog.service.product.support.ProductStorePriceApplier;
import com.pos.service.businessconfig.support.StoreBusinessTypeResolver;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.service.support.ProductLookupSupport;
import com.pos.service.support.ProductValueNormalizer;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductCreateHandler {

    private final ProductRepository productRepository;
    private final ProductLookupSupport productLookup;
    private final CategoryRepository categoryRepository;
    private final TenantAccessSupport tenantAccess;
    private final ProductBarcodeValidator barcodeValidator;
    private final ProductPluValidator pluValidator;
    private final ProductStorePriceApplier storePriceApplier;
    private final ProductInitialStockSupport initialStockSupport;
    private final ProductExtensionService extensionService;
    private final UnitCatalogService unitCatalogService;
    private final ProductAttributeService productAttributeService;
    private final StoreBusinessTypeResolver storeBusinessTypeResolver;
    private final CatalogIsolationSupport catalogIsolation;
    private final ProductResponseAssembler assembler;
    private final ProductSnapshotNotifier productSnapshotNotifier;

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        return createInternal(req);
    }

    private ProductResponse createInternal(CreateProductRequest req) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Optional<Product> inactiveBySku = productLookup.findOne(
            ProductSpecifications.lookup(companyId).sku(req.sku()).anyActiveState()
        );

        if (inactiveBySku.isPresent()) {
            Product existing = inactiveBySku.get();
            if (catalogIsolation.isPharmacyProduct(existing)) {
                throw PosExceptions.conflict("SKU already exists in another catalog", "sku", req.sku());
            }
        }

        if (inactiveBySku.isPresent() && !inactiveBySku.get().isActive()) {
            return reactivate(req, inactiveBySku.get());
        }
        if (inactiveBySku.isPresent() && inactiveBySku.get().isActive() && !StringUtils.hasText(req.uzInvoiceDocumentId())) {
            throw PosExceptions.badRequest("SKU already exists: " + req.sku(), "sku", req.sku());
        }

        Category category = resolveCategory(req.categoryId(), companyId);
        barcodeValidator.validateForCreate(companyId, req.barcode(), req.additionalBarcodes());
        String plu = pluValidator.normalizeOrNull(req.plu());
        if (plu != null) {
            productRepository.findByCompany_IdAndPlu(companyId, plu).ifPresent(existing -> {
                throw PosExceptions.conflict("PLU already in use", "plu", plu);
            });
        }

        Product product = buildNewProduct(req, companyId, category);
        applyBusinessType(product, req.businessTypeCode(), category);
        Product saved = productRepository.save(product);
        storePriceApplier.applyStorePrices(saved, req.storePrices());
        storePriceApplier.applyExtraBarcodes(saved, req.additionalBarcodes(), saved.getBarcode());
        Product persisted = productRepository.save(saved);

        initialStockSupport.applyIfPresent(
            persisted, req.initialStock(), req.storePrices(), companyId, "Начальный остаток при создании товара"
        );
        productAttributeService.saveAttributes(persisted.getId(), req.businessTypeCode(), req.attributes());

        LogUtil.info(ProductCreateHandler.class, "Product created: id={}, sku={}", persisted.getId(), persisted.getSku());
        productSnapshotNotifier.notify(persisted.getId());
        return assembler.toResponse(persisted);
    }

    private ProductResponse reactivate(CreateProductRequest req, Product product) {
        Integer companyId = product.getCompany().getId();
        Category category = resolveCategory(req.categoryId(), companyId);
        barcodeValidator.validateForUpdate(companyId, req.barcode(), req.additionalBarcodes(), product.getId());

        product.setName(req.name());
        product.setDescription(req.description());
        product.setCategory(category);
        product.setCostPrice(req.costPrice());
        product.setSellingPrice(req.sellingPrice());
        product.setDefaultDiscountPercent(ProductValueNormalizer.discountPercent(req.defaultDiscountPercent()));
        product.setTaxRate(ProductValueNormalizer.taxRatePercent(req.taxRate()));
        product.setLowStockAlert(req.lowStockAlert() != null ? req.lowStockAlert() : 10);
        product.setBarcode(req.barcode());
        product.setPlu(pluValidator.normalizeOrNull(req.plu()));
        product.setImageUrl(req.imageUrl());
        product.setActive(true);
        product.setExternalProductId(req.externalProductId());
        product.setIkpu(req.ikpu());
        product.setIkpuStatus(StringUtils.hasText(req.ikpuStatus()) ? req.ikpuStatus() : "UNKNOWN");
        product.setUnitOfMeasure(StringUtils.hasText(req.unitOfMeasure()) ? req.unitOfMeasure() : "pcs");
        product.setUnitMeasureCode(req.unitMeasureCode());
        product.setPackageCode(req.packageCode());
        product.setStorageLocation(StringUtils.hasText(req.storageLocation()) ? req.storageLocation().trim() : null);
        product.setOwnerType(StringUtils.hasText(req.ownerType()) ? req.ownerType() : "OWN");
        product.setCommissionTin(req.commissionTin());
        product.setCommissionPinfl(req.commissionPinfl());
        product.setUzInvoiceDocumentId(
            StringUtils.hasText(req.uzInvoiceDocumentId()) ? req.uzInvoiceDocumentId().trim().toUpperCase() : null
        );
        applyBusinessType(product, req.businessTypeCode(), category);

        BigDecimal initialStock = req.initialStock() != null ? QuantityUtil.normalize(req.initialStock()) : BigDecimal.ZERO;
        ProductQuantityRulesResolver.applyTo(
            product, req.saleType(), req.unitCode(), req.quantityScale(), req.allowFraction(), req.unitOfMeasure()
        );
        product.setStockQuantity(BigDecimal.ZERO);
        extensionService.applyOnCreate(product, req);

        Product saved = productRepository.save(product);
        storePriceApplier.applyStorePrices(saved, req.storePrices());
        storePriceApplier.applyExtraBarcodes(saved, req.additionalBarcodes(), saved.getBarcode());
        Product persisted = productRepository.save(saved);

        initialStockSupport.applyIfPresent(
            persisted, initialStock, req.storePrices(), companyId, "Начальный остаток при повторном импорте"
        );

        LogUtil.info(ProductCreateHandler.class, "Product reactivated: id={}, sku={}", persisted.getId(), persisted.getSku());
        productSnapshotNotifier.notify(persisted.getId());
        return assembler.toResponse(persisted);
    }

    private Product buildNewProduct(CreateProductRequest req, Integer companyId, Category category) {
        Product product = Product.builder()
            .company(tenantAccess.requireCompany(companyId))
            .sku(req.sku())
            .name(req.name())
            .description(req.description())
            .category(category)
            .costPrice(req.costPrice())
            .sellingPrice(req.sellingPrice())
            .defaultDiscountPercent(ProductValueNormalizer.discountPercent(req.defaultDiscountPercent()))
            .taxRate(ProductValueNormalizer.taxRatePercent(req.taxRate()))
            .stockQuantity(BigDecimal.ZERO)
            .lowStockAlert(req.lowStockAlert() != null ? req.lowStockAlert() : 10)
            .barcode(req.barcode())
            .plu(pluValidator.normalizeOrNull(req.plu()))
            .imageUrl(req.imageUrl())
            .isActive(true)
            .externalProductId(req.externalProductId())
            .ikpu(req.ikpu())
            .ikpuStatus(StringUtils.hasText(req.ikpuStatus()) ? req.ikpuStatus() : "UNKNOWN")
            .unitOfMeasure(
                SaleTypeSupport.defaultUnitOfMeasure(
                    SaleTypeSupport.resolve(req.saleType(), req.unitOfMeasure()),
                    req.unitOfMeasure()
                )
            )
            .unitMeasureCode(req.unitMeasureCode())
            .packageCode(req.packageCode())
            .storageLocation(StringUtils.hasText(req.storageLocation()) ? req.storageLocation().trim() : null)
            .ownerType(StringUtils.hasText(req.ownerType()) ? req.ownerType() : "OWN")
            .commissionTin(req.commissionTin())
            .commissionPinfl(req.commissionPinfl())
            .uzInvoiceDocumentId(
                StringUtils.hasText(req.uzInvoiceDocumentId()) ? req.uzInvoiceDocumentId().trim().toUpperCase() : null
            )
            .build();

        ProductQuantityRulesResolver.applyTo(
            product, req.saleType(), req.unitCode(), req.quantityScale(), req.allowFraction(), req.unitOfMeasure()
        );
        unitCatalogService.requireStockUnit(product.getUnitCode());
        if (!StringUtils.hasText(product.getUnitOfMeasure())) {
            product.setUnitOfMeasure(SaleTypeSupport.defaultUnitOfMeasure(product.getSaleType(), req.unitOfMeasure()));
        }
        extensionService.applyOnCreate(product, req);
        return product;
    }

    private void applyBusinessType(Product product, String businessTypeCode, Category category) {
        if (StringUtils.hasText(businessTypeCode)) {
            product.setBusinessType(
                storeBusinessTypeResolver.resolveForCreate(product.getCompany(), null, businessTypeCode)
            );
            return;
        }
        if (product.getBusinessType() == null && category != null && category.getBusinessType() != null) {
            product.setBusinessType(category.getBusinessType());
        }
    }

    private Category resolveCategory(Integer categoryId, Integer companyId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
            .filter(category -> category.getCompany().getId().equals(companyId))
            .orElseThrow(() -> PosExceptions.notFound("Category", categoryId));
    }
}
