package com.pos.restaurant.edge.warehouse.support;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.repository.EdgeProductRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeWhStockOps {

    private final EdgeProductRepository productRepository;

    public EdgeProduct require(Integer companyId, Integer storeId, UUID productId) {
        if (productId == null || storeId == null) {
            throw new BusinessException("productId/storeId required");
        }
        return productRepository.findByIdAndCompanyIdAndStoreId(productId, companyId, storeId)
            .orElseThrow(() -> new NotFoundException("Product not found"));
    }

    public void increase(EdgeProduct p, BigDecimal qty) {
        p.setStockQty(EdgeWhMaps.nz(p.getStockQty()).add(qty));
        productRepository.save(p);
    }

    public void decrease(EdgeProduct p, BigDecimal qty) {
        if (p.getStockQty().compareTo(qty) < 0) {
            throw new BusinessException("Insufficient stock: " + p.getName());
        }
        p.setStockQty(p.getStockQty().subtract(qty));
        productRepository.save(p);
    }

    public void setQty(EdgeProduct p, BigDecimal qty) {
        p.setStockQty(qty);
        productRepository.save(p);
    }

    public EdgeProduct findOrClone(Integer companyId, Integer toStoreId, UUID productId, EdgeProduct from) {
        return productRepository.findByIdAndCompanyIdAndStoreId(productId, companyId, toStoreId)
            .orElseGet(() -> cloneForStore(from, toStoreId));
    }

    public EdgeProduct save(EdgeProduct p) {
        return productRepository.save(p);
    }

    private static EdgeProduct cloneForStore(EdgeProduct from, Integer toStoreId) {
        EdgeProduct to = new EdgeProduct();
        to.setId(from.getId());
        to.setCompanyId(from.getCompanyId());
        to.setStoreId(toStoreId);
        to.setSku(from.getSku());
        to.setName(from.getName());
        to.setBarcode(from.getBarcode());
        to.setUnitCode(from.getUnitCode());
        to.setTaxRate(from.getTaxRate());
        to.setCostPrice(from.getCostPrice());
        to.setSellingPrice(from.getSellingPrice());
        to.setStockQty(BigDecimal.ZERO);
        to.setLowStockAlert(from.getLowStockAlert());
        to.setIkpu(from.getIkpu());
        to.setPackageCode(from.getPackageCode());
        to.setUnitOfMeasure(from.getUnitOfMeasure());
        to.setUnitMeasureCode(from.getUnitMeasureCode());
        to.setMarkedProduct(from.isMarkedProduct());
        to.setActive(from.isActive());
        return to;
    }
}
