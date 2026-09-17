package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.catalog.dto.*;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.entity.ProductBarcode;
import com.pos.pharmacy.catalog.repository.ProductBarcodeRepository;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.domain.ProductType;
import com.pos.pharmacy.domain.SaleType;
import com.pos.pharmacy.domain.UnitCode;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.catalog.support.PharmacyBarcodeClaim;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductCatalogService {

    private final ProductRepository productRepository;
    private final ProductBarcodeRepository productBarcodeRepository;
    private final ProductAttributeService productAttributeService;
    private final StoreStockService storeStockService;
    private final PharmacyBarcodeClaim barcodeClaim;
    private final TenantSupport tenant;
    private final ProductFiscalFieldsApplier fiscalFields;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> list(String search, boolean activeOnly, Integer storeId, Pageable pageable) {
        Integer companyId = tenant.requireCompanyId();
        Page<Product> page = productRepository.search(companyId, trim(search), activeOnly, pageable);
        return PageResponse.from(page.map(p -> toResponse(p, storeId)));
    }

    @Transactional(readOnly = true)
    public ProductResponse get(UUID id, Integer storeId) {
        Product product = requireOwned(id);
        return toResponse(product, storeId);
    }

    @Transactional(readOnly = true)
    public ProductResponse getByBarcode(String barcode, Integer storeId) {
        Integer companyId = tenant.requireCompanyId();
        Product product = productRepository.findByCompanyIdAndBarcode(companyId, barcode.trim())
            .or(() -> productBarcodeRepository.findByBarcode(barcode.trim()).flatMap(
                pb -> productRepository.findById(pb.getProductId())
                    .filter(p -> p.getCompanyId().equals(companyId))
            ))
            .orElseThrow(() -> PharmacyErrors.notFound("Product for barcode", barcode));
        if (!product.isActive()) {
            throw PharmacyErrors.badRequest("Product is not active");
        }
        return toResponse(product, storeId);
    }

    public ProductResponse create(CreateProductRequest req) {
        Integer companyId = tenant.requireCompanyId();
        if (productRepository.findByCompanyIdAndSku(companyId, req.sku()).filter(Product::isActive).isPresent()) {
            throw PharmacyErrors.conflict("SKU already exists", "sku", req.sku());
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
            .taxRate(taxRate(req.taxRate()))
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
            .ikpu(req.ikpu())
            .ikpuStatus(req.ikpuStatus() != null ? req.ikpuStatus() : "UNKNOWN")
            .unitOfMeasure(req.unitOfMeasure())
            .unitMeasureCode(req.unitMeasureCode())
            .packageCode(req.packageCode())
            .soldIndividually(req.soldIndividually() == null || req.soldIndividually())
            .markedProduct(Boolean.TRUE.equals(req.markedProduct()))
            .storageLocation(req.storageLocation())
            .ownerType(req.ownerType())
            .commissionTin(req.commissionTin())
            .commissionPinfl(req.commissionPinfl())
            .uzInvoiceDocumentId(req.uzInvoiceDocumentId())
            .build();
        Product saved = productRepository.save(product);
        saveExtraBarcodes(saved.getId(), req.additionalBarcodes());
        productAttributeService.saveAttributes(saved.getId(), req.attributes());
        if (req.initialStock() != null && req.initialStock().compareTo(BigDecimal.ZERO) > 0
            && req.storePrices() != null && !req.storePrices().isEmpty()) {
            storeStockService.increase(saved, req.storePrices().get(0).storeId(), req.initialStock());
            productRepository.save(saved);
        }
        return toResponse(saved, null);
    }

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
            product.setTaxRate(taxRate(req.taxRate()));
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
            product.setBarcode(trim(req.barcode()));
        }
        if (req.plu() != null) {
            product.setPlu(trim(req.plu()));
        }
        if (req.imageUrl() != null) {
            product.setImageUrl(req.imageUrl());
        }
        if (req.active() != null) {
            product.setActive(req.active());
        }
        if (req.attributes() != null) {
            productAttributeService.saveAttributes(product.getId(), req.attributes());
        }
        fiscalFields.apply(product, req);
        return toResponse(productRepository.save(product), null);
    }

    public int bulkUpdateTaxRate(BulkTaxRateRequest req) {
        Integer companyId = tenant.requireCompanyId();
        List<Product> products = productRepository.findAllById(req.productIds()).stream()
            .filter(p -> p.getCompanyId().equals(companyId))
            .toList();
        if (products.isEmpty()) {
            throw PharmacyErrors.badRequest("No products found for provided ids");
        }
        BigDecimal tax = taxRate(req.taxRate());
        products.forEach(p -> p.setTaxRate(tax));
        productRepository.saveAll(products);
        return products.size();
    }

    public void deactivate(UUID id) {
        Product product = requireOwned(id);
        if (!product.isActive()) {
            return;
        }
        barcodeClaim.release(product);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public Product requireActive(UUID id) {
        Product product = requireOwned(id);
        if (!product.isActive()) {
            throw PharmacyErrors.badRequest("Product is not active");
        }
        return product;
    }

    private Product requireOwned(UUID id) {
        Integer companyId = tenant.requireCompanyId();
        return productRepository.findById(id)
            .filter(p -> p.getCompanyId().equals(companyId))
            .orElseThrow(() -> PharmacyErrors.notFound("Product", id));
    }

    private void saveExtraBarcodes(UUID productId, List<String> barcodes) {
        if (barcodes == null) {
            return;
        }
        for (String barcode : barcodes) {
            if (!StringUtils.hasText(barcode)) {
                continue;
            }
            productBarcodeRepository.save(ProductBarcode.builder()
                .productId(productId)
                .barcode(barcode.trim())
                .build());
        }
    }

    private ProductResponse toResponse(Product product, Integer storeId) {
        Map<String, String> attributes = productAttributeService.getAttributes(product.getId());
        BigDecimal stockQty = storeId != null
            ? storeStockService.getQuantity(product.getId(), storeId)
            : product.getStockQuantity();
        boolean lowStock = stockQty.compareTo(BigDecimal.valueOf(product.getLowStockAlert())) <= 0;
        return new ProductResponse(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getDescription(),
            product.getCategoryId(),
            null,
            product.getCostPrice(),
            product.getSellingPrice(),
            product.getDefaultDiscountPercent(),
            product.getTaxRate(),
            product.getProductType(),
            product.getSaleType(),
            product.getUnitCode(),
            product.getQuantityScale(),
            product.isAllowFraction(),
            stockQty,
            0,
            product.getLowStockAlert(),
            lowStock,
            product.getBarcode(),
            product.getPlu(),
            List.of(),
            product.getImageUrl(),
            product.isActive(),
            product.getCreatedAt(),
            product.getExternalProductId(),
            product.getIkpu(),
            product.getIkpuStatus(),
            product.getUnitOfMeasure(),
            product.getUnitMeasureCode(),
            product.getPackageCode(),
            product.isSoldIndividually(),
            product.isMarkedProduct(),
            product.getStorageLocation(),
            product.getOwnerType(),
            product.getCommissionTin(),
            product.getCommissionPinfl(),
            0,
            List.of(),
            null,
            null,
            attributes
        );
    }

    private static BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal taxRate(BigDecimal value) {
        return value == null ? new BigDecimal("12") : value.setScale(2, RoundingMode.HALF_UP);
    }

    private static String trim(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
