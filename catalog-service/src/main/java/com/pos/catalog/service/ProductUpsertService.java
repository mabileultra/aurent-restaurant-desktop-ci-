package com.pos.catalog.service;

import com.pos.catalog.dto.ProductCardResponse;
import com.pos.catalog.dto.UpsertProductRequest;
import com.pos.catalog.entity.Category;
import com.pos.catalog.entity.Product;
import com.pos.catalog.event.CatalogOutboxWriter;
import com.pos.catalog.exception.CatalogExceptions;
import com.pos.catalog.mapper.ProductCardMapper;
import com.pos.catalog.repository.CategoryRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.support.ProductBarcodeSync;
import com.pos.catalog.service.support.ProductBarcodeUniqueness;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductUpsertService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductBarcodeUniqueness barcodeUniqueness;
    private final ProductBarcodeSync barcodeSync;
    private final ProductCardMapper mapper;
    private final CatalogOutboxWriter outboxWriter;

    @Transactional
    public ProductCardResponse upsert(UpsertProductRequest req) {
        UUID id = req.id();
        Integer companyId = req.companyId();
        String sku = req.sku().trim();

        if (productRepository.existsByCompanyIdAndSkuIgnoreCaseAndIdNot(companyId, sku, id)) {
            throw CatalogExceptions.conflict("SKU уже существует: " + sku);
        }

        Product product = productRepository.findById(id).orElseGet(() -> {
            Product created = new Product();
            created.setId(id);
            created.setCompanyId(companyId);
            return created;
        });

        if (product.getCompanyId() != null && !product.getCompanyId().equals(companyId)) {
            throw CatalogExceptions.conflict("Товар принадлежит другой компании");
        }

        apply(product, req, sku);
        List<String> extras = barcodeSync.normalize(req.additionalBarcodes());
        barcodeSync.replaceExtras(product, extras, product.getBarcode());
        Product saved = productRepository.save(product);
        outboxWriter.enqueueProductSnapshot(saved);
        LogUtil.info(
            ProductUpsertService.class,
            "catalog-service product upsert id={} companyId={} sku={} active={}",
            saved.getId(),
            saved.getCompanyId(),
            saved.getSku(),
            saved.isActive()
        );
        return mapper.toCard(saved);
    }

    private void apply(Product product, UpsertProductRequest req, String sku) {
        product.setCompanyId(req.companyId());
        product.setSku(sku);
        product.setName(req.name().trim());
        product.setDescription(req.description());
        product.setCategory(resolveCategory(req.categoryId(), req.companyId()));
        product.setCostPrice(nullToZero(req.costPrice()));
        product.setSellingPrice(req.sellingPrice());
        product.setDefaultDiscountPercent(nullToZero(req.defaultDiscountPercent()));
        if (req.taxRate() != null) {
            product.setTaxRate(req.taxRate());
        }
        product.setProductType(defaultText(req.productType(), "RETAIL"));
        product.setSaleType(defaultText(req.saleType(), "PIECE"));
        product.setUnitCode(defaultText(req.unitCode(), "PCS"));
        product.setQuantityScale(req.quantityScale() != null ? req.quantityScale() : 0);
        product.setAllowFraction(Boolean.TRUE.equals(req.allowFraction()));
        product.setLowStockAlert(req.lowStockAlert() != null ? req.lowStockAlert() : 10);

        String barcode = blankToNull(req.barcode());
        if (barcode != null && !barcode.equals(product.getBarcode())) {
            barcodeUniqueness.assertAvailable(req.companyId(), barcode, product.getId());
        }
        product.setBarcode(barcode);
        product.setPlu(blankToNull(req.plu()));
        product.setImageUrl(blankToNull(req.imageUrl()));
        product.setActive(req.active() == null || req.active());
        product.setExternalProductId(blankToNull(req.externalProductId()));
        product.setIkpu(blankToNull(req.ikpu()));
        if (StringUtils.hasText(req.ikpuStatus())) {
            product.setIkpuStatus(req.ikpuStatus().trim());
        }
        product.setUnitOfMeasure(blankToNull(req.unitOfMeasure()));
        product.setSoldIndividually(req.soldIndividually() == null || req.soldIndividually());
        product.setMarkedProduct(Boolean.TRUE.equals(req.markedProduct()));
        product.setStorageLocation(blankToNull(req.storageLocation()));
        product.setBusinessTypeCode(blankToNull(req.businessTypeCode()));
    }

    private Category resolveCategory(UUID categoryId, Integer companyId) {
        if (categoryId == null) {
            return null;
        }
        // Soft: category may arrive later via category dual-write/backfill.
        return categoryRepository.findByIdAndCompanyId(categoryId, companyId).orElse(null);
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
