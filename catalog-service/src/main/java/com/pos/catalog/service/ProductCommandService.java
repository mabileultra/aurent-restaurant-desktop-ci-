package com.pos.catalog.service;

import com.pos.catalog.dto.CreateProductRequest;
import com.pos.catalog.dto.ProductCardResponse;
import com.pos.catalog.dto.UpdateProductRequest;
import com.pos.catalog.entity.Category;
import com.pos.catalog.entity.Product;
import com.pos.catalog.event.CatalogOutboxWriter;
import com.pos.catalog.exception.CatalogExceptions;
import com.pos.catalog.mapper.ProductCardMapper;
import com.pos.catalog.repository.CategoryRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.support.ProductBarcodeSync;
import com.pos.catalog.service.support.ProductBarcodeUniqueness;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductCommandService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductBarcodeUniqueness barcodeUniqueness;
    private final ProductBarcodeSync barcodeSync;
    private final ProductCardMapper mapper;
    private final CatalogOutboxWriter outboxWriter;

    @Transactional
    public ProductCardResponse create(Integer companyId, CreateProductRequest req) {
        String sku = req.sku().trim();
        if (productRepository.existsByCompanyIdAndSkuIgnoreCase(companyId, sku)) {
            throw CatalogExceptions.conflict("SKU уже существует: " + sku);
        }
        String barcode = blankToNull(req.barcode());
        barcodeUniqueness.assertAvailable(companyId, barcode, null);

        Category category = resolveCategory(req.categoryId(), companyId);
        Product product = Product.builder()
            .companyId(companyId)
            .sku(sku)
            .name(req.name().trim())
            .description(req.description())
            .category(category)
            .businessTypeCode(blankToNull(req.businessTypeCode()))
            .productType(defaultText(req.productType(), "RETAIL"))
            .costPrice(nullToZero(req.costPrice()))
            .sellingPrice(req.sellingPrice())
            .defaultDiscountPercent(nullToZero(req.defaultDiscountPercent()))
            .taxRate(req.taxRate() != null ? req.taxRate() : new BigDecimal("12"))
            .saleType(defaultText(req.saleType(), "PIECE"))
            .unitCode(defaultText(req.unitCode(), "PCS"))
            .quantityScale(req.quantityScale() != null ? req.quantityScale() : 0)
            .allowFraction(Boolean.TRUE.equals(req.allowFraction()))
            .lowStockAlert(req.lowStockAlert() != null ? req.lowStockAlert() : 10)
            .barcode(barcode)
            .plu(blankToNull(req.plu()))
            .imageUrl(blankToNull(req.imageUrl()))
            .externalProductId(blankToNull(req.externalProductId()))
            .ikpu(blankToNull(req.ikpu()))
            .unitOfMeasure(blankToNull(req.unitOfMeasure()))
            .soldIndividually(req.soldIndividually() == null || req.soldIndividually())
            .markedProduct(Boolean.TRUE.equals(req.markedProduct()))
            .storageLocation(blankToNull(req.storageLocation()))
            .active(true)
            .build();

        List<String> extras = barcodeSync.normalize(req.additionalBarcodes());
        barcodeSync.replaceExtras(product, extras, barcode);
        Product saved = productRepository.save(product);
        outboxWriter.enqueueProductSnapshot(saved);
        return mapper.toCard(saved);
    }

    @Transactional
    public ProductCardResponse update(UUID id, Integer companyId, UpdateProductRequest req) {
        Product product = productRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> CatalogExceptions.notFound("Товар не найден"));

        if (StringUtils.hasText(req.sku())) {
            String sku = req.sku().trim();
            if (productRepository.existsByCompanyIdAndSkuIgnoreCaseAndIdNot(companyId, sku, id)) {
                throw CatalogExceptions.conflict("SKU уже существует: " + sku);
            }
            product.setSku(sku);
        }
        if (StringUtils.hasText(req.name())) {
            product.setName(req.name().trim());
        }
        if (req.description() != null) {
            product.setDescription(req.description());
        }
        if (req.categoryId() != null) {
            product.setCategory(resolveCategory(req.categoryId(), companyId));
        }
        if (req.businessTypeCode() != null) {
            product.setBusinessTypeCode(blankToNull(req.businessTypeCode()));
        }
        if (StringUtils.hasText(req.productType())) {
            product.setProductType(req.productType().trim());
        }
        if (req.costPrice() != null) {
            product.setCostPrice(req.costPrice());
        }
        if (req.sellingPrice() != null) {
            product.setSellingPrice(req.sellingPrice());
        }
        if (req.defaultDiscountPercent() != null) {
            product.setDefaultDiscountPercent(req.defaultDiscountPercent());
        }
        if (req.taxRate() != null) {
            product.setTaxRate(req.taxRate());
        }
        if (StringUtils.hasText(req.saleType())) {
            product.setSaleType(req.saleType().trim());
        }
        if (StringUtils.hasText(req.unitCode())) {
            product.setUnitCode(req.unitCode().trim());
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
            String barcode = blankToNull(req.barcode());
            if (barcode != null && !barcode.equals(product.getBarcode())) {
                barcodeUniqueness.assertAvailable(companyId, barcode, id);
            }
            product.setBarcode(barcode);
        }
        if (req.plu() != null) {
            product.setPlu(blankToNull(req.plu()));
        }
        if (req.imageUrl() != null) {
            product.setImageUrl(blankToNull(req.imageUrl()));
        }
        if (req.active() != null) {
            product.setActive(req.active());
        }
        if (req.externalProductId() != null) {
            product.setExternalProductId(blankToNull(req.externalProductId()));
        }
        if (req.ikpu() != null) {
            product.setIkpu(blankToNull(req.ikpu()));
        }
        if (req.unitOfMeasure() != null) {
            product.setUnitOfMeasure(blankToNull(req.unitOfMeasure()));
        }
        if (req.soldIndividually() != null) {
            product.setSoldIndividually(req.soldIndividually());
        }
        if (req.markedProduct() != null) {
            product.setMarkedProduct(req.markedProduct());
        }
        if (req.storageLocation() != null) {
            product.setStorageLocation(blankToNull(req.storageLocation()));
        }
        if (req.additionalBarcodes() != null) {
            barcodeSync.replaceExtras(
                product,
                barcodeSync.normalize(req.additionalBarcodes()),
                product.getBarcode()
            );
        }

        Product saved = productRepository.save(product);
        outboxWriter.enqueueProductSnapshot(saved);
        return mapper.toCard(saved);
    }

    private Category resolveCategory(UUID categoryId, Integer companyId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findByIdAndCompanyId(categoryId, companyId)
            .orElseThrow(() -> CatalogExceptions.badRequest("Категория не найдена"));
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
