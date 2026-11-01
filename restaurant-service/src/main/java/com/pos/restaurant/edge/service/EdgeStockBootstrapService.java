package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.dto.catalog.EdgeStockBootstrapRequest;
import com.pos.restaurant.edge.dto.catalog.EdgeStockBootstrapRequest.ProductRow;
import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.repository.EdgeProductRepository;
import com.pos.restaurant.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStockBootstrapService {

    private final EdgeProductRepository productRepository;

    @Value("${app.restaurant.edge.bootstrap-secret:}")
    private String bootstrapSecret;

    @Transactional
    public Map<String, Object> importProducts(EdgeStockBootstrapRequest request) {
        if (request.companyId() == null || request.storeId() == null) {
            throw new BusinessException("companyId and storeId required");
        }
        long existingCount = productRepository.countByCompanyIdAndStoreId(request.companyId(), request.storeId());
        if (existingCount == 0
            && StringUtils.hasText(bootstrapSecret)
            && !bootstrapSecret.equals(String.valueOf(request.bootstrapSecret()))) {
            throw new BusinessException("Invalid bootstrap secret");
        }
        int saved = 0;
        int skipped = 0;
        for (ProductRow row : request.products()) {
            if (row == null || row.id() == null || !StringUtils.hasText(row.name())) {
                continue;
            }
            Optional<EdgeProduct> found = productRepository
                .findByIdAndCompanyIdAndStoreId(row.id(), request.companyId(), request.storeId());
            if (found.isPresent() && isLocalNewer(found.get().getUpdatedAt(), row.updatedAt())) {
                skipped++;
                continue;
            }
            EdgeProduct e = found.orElseGet(EdgeProduct::new);
            applyRow(e, request.companyId(), request.storeId(), row);
            productRepository.save(e);
            saved++;
        }
        Map<String, Object> out = new HashMap<>();
        out.put("saved", saved);
        out.put("skipped", skipped);
        out.put("hasStock", productRepository.countByCompanyIdAndStoreId(request.companyId(), request.storeId()) > 0);
        return out;
    }

    @Transactional(readOnly = true)
    public boolean hasAnyStock() {
        return productRepository.count() > 0;
    }

    private static void applyRow(EdgeProduct e, Integer companyId, Integer storeId, ProductRow row) {
        e.setId(row.id());
        e.setCompanyId(companyId);
        e.setStoreId(storeId);
        e.setSku(row.sku());
        e.setName(row.name().trim());
        e.setBarcode(row.barcode());
        e.setUnitCode(row.unitCode());
        e.setTaxRate(nz(row.taxRate()));
        e.setCostPrice(nz(row.costPrice()));
        e.setSellingPrice(nz(row.sellingPrice()));
        e.setStockQty(row.stockQuantity() == null ? BigDecimal.ZERO : row.stockQuantity());
        e.setLowStockAlert(row.lowStockAlert() == null ? 0 : row.lowStockAlert());
        e.setIkpu(row.ikpu());
        e.setPackageCode(row.packageCode());
        e.setUnitOfMeasure(row.unitOfMeasure());
        e.setUnitMeasureCode(row.unitMeasureCode());
        e.setMarkedProduct(Boolean.TRUE.equals(row.markedProduct()));
        e.setActive(row.active() == null || row.active());
        e.setUpdatedAt(row.updatedAt() != null ? row.updatedAt() : Instant.now());
    }

    private static boolean isLocalNewer(Instant local, Instant incoming) {
        if (local == null || incoming == null) {
            return false;
        }
        return local.isAfter(incoming);
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
