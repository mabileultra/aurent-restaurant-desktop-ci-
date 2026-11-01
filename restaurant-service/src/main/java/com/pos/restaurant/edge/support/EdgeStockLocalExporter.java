package com.pos.restaurant.edge.support;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.repository.EdgeProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Export local edge_products for cloud stock ingest (S4). */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStockLocalExporter {

    private final EdgeProductRepository productRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> exportForStore(Integer companyId, Integer storeId) {
        List<EdgeProduct> rows = productRepository.findByCompanyIdAndStoreId(companyId, storeId);
        List<Map<String, Object>> products = new ArrayList<>();
        for (EdgeProduct p : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", p.getId());
            item.put("sku", p.getSku());
            item.put("name", p.getName());
            item.put("barcode", p.getBarcode());
            item.put("unitCode", p.getUnitCode());
            item.put("taxRate", p.getTaxRate());
            item.put("costPrice", p.getCostPrice());
            item.put("sellingPrice", p.getSellingPrice());
            item.put("stockQuantity", p.getStockQty());
            item.put("lowStockAlert", p.getLowStockAlert());
            item.put("ikpu", p.getIkpu());
            item.put("packageCode", p.getPackageCode());
            item.put("unitOfMeasure", p.getUnitOfMeasure());
            item.put("unitMeasureCode", p.getUnitMeasureCode());
            item.put("markedProduct", p.isMarkedProduct());
            item.put("active", p.isActive());
            item.put("updatedAt", p.getUpdatedAt());
            products.add(item);
        }
        Map<String, Object> out = new HashMap<>();
        out.put("companyId", companyId);
        out.put("storeId", storeId);
        out.put("products", products);
        return out;
    }
}
