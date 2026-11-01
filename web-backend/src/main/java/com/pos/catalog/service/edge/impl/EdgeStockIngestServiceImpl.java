package com.pos.catalog.service.edge.impl;

import com.pos.catalog.dto.edge.EdgeStockIngestItem;
import com.pos.catalog.dto.edge.EdgeStockIngestRequest;
import com.pos.catalog.dto.edge.EdgeStockIngestResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.edge.EdgeStockIngestService;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EdgeStockIngestServiceImpl implements EdgeStockIngestService {

    private final TenantAccessSupport tenantAccess;
    private final ProductRepository productRepository;
    private final StoreStockService storeStockService;

    @Override
    @Transactional
    public EdgeStockIngestResponse ingest(EdgeStockIngestRequest request) {
        if (request.storeId() == null) {
            throw new BadRequestException("storeId required");
        }
        Integer companyId = tenantAccess.resolveCompanyIdForCreate(null);
        Store store = storeStockService.requireStoreForCompany(companyId, request.storeId());

        List<EdgeStockIngestItem> products = request.products() == null ? List.of() : request.products();
        int upserted = 0;
        int skipped = 0;
        for (EdgeStockIngestItem item : products) {
            try {
                if (applyOne(companyId, store, item)) {
                    upserted++;
                } else {
                    skipped++;
                }
            } catch (Exception ex) {
                skipped++;
                LogUtil.warn(
                    EdgeStockIngestServiceImpl.class,
                    "edge stock ingest skip id=" + (item == null ? null : item.id()) + ": " + ex.getMessage()
                );
            }
        }
        return new EdgeStockIngestResponse(upserted, skipped, store.getId());
    }

    private boolean applyOne(Integer companyId, Store store, EdgeStockIngestItem item) {
        if (item == null || item.id() == null) {
            return false;
        }
        Product product = productRepository.findById(item.id()).orElse(null);
        if (product == null
            || product.getCompany() == null
            || !companyId.equals(product.getCompany().getId())) {
            return false;
        }
        if (isCloudNewer(product.getUpdatedAt(), item.updatedAt())) {
            return false;
        }
        if (StringUtils.hasText(item.name())) {
            product.setName(item.name().trim());
        }
        if (item.barcode() != null) {
            product.setBarcode(item.barcode());
        }
        if (item.costPrice() != null) {
            product.setCostPrice(item.costPrice());
        }
        if (item.sellingPrice() != null) {
            product.setSellingPrice(item.sellingPrice());
        }
        if (item.taxRate() != null) {
            product.setTaxRate(item.taxRate());
        }
        if (item.lowStockAlert() != null) {
            product.setLowStockAlert(item.lowStockAlert());
        }
        if (item.active() != null) {
            product.setActive(item.active());
        }
        if (StringUtils.hasText(item.ikpu())) {
            product.setIkpu(item.ikpu().trim());
        }
        if (item.packageCode() != null) {
            product.setPackageCode(item.packageCode());
        }
        if (item.unitOfMeasure() != null) {
            product.setUnitOfMeasure(item.unitOfMeasure());
        }
        if (item.unitMeasureCode() != null) {
            product.setUnitMeasureCode(item.unitMeasureCode());
        }
        if (item.stockQuantity() != null) {
            storeStockService.setQuantity(product, store, QuantityUtil.normalize(item.stockQuantity()));
        }
        product.setUpdatedAt(item.updatedAt() != null ? item.updatedAt() : Instant.now());
        productRepository.save(product);
        return true;
    }

    private static boolean isCloudNewer(Instant cloud, Instant local) {
        if (cloud == null || local == null) {
            return false;
        }
        return cloud.isAfter(local);
    }
}
