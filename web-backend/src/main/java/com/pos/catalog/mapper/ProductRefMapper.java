package com.pos.catalog.mapper;

import com.pos.catalog.dto.ref.ProductRef;
import com.pos.catalog.dto.ref.WeightProductRef;
import com.pos.catalog.entity.Product;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import org.springframework.stereotype.Component;

@Component
public class ProductRefMapper {

    public ProductRef toRef(Product product) {
        if (product == null) {
            return null;
        }
        UnitCode unit = product.getUnitCode();
        Integer companyId = product.getCompany() != null ? product.getCompany().getId() : null;
        return new ProductRef(
            product.getId(),
            companyId,
            product.getSku(),
            product.getName(),
            product.getBarcode(),
            product.getIkpu(),
            product.getSellingPrice(),
            product.getCostPrice(),
            unit != null ? unit.name() : null,
            product.isActive(),
            product.getSaleType() == SaleType.WEIGHT
        );
    }

    public WeightProductRef toWeightRef(Product product) {
        if (product == null) {
            return null;
        }
        UnitCode unit = product.getUnitCode();
        return new WeightProductRef(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getPlu(),
            product.getBarcode(),
            product.getSellingPrice(),
            unit != null ? unit.name() : null,
            product.getQuantityScale(),
            product.isAllowFraction(),
            product.isActive(),
            product.getStockQuantity()
        );
    }
}
