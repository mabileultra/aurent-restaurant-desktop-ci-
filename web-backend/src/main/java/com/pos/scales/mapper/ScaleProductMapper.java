package com.pos.scales.mapper;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.dto.ref.WeightProductRef;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import com.pos.mapper.PosMapperConfig;
import com.pos.scales.dto.ScaleProductDto;
import org.mapstruct.Mapper;
import org.springframework.util.StringUtils;

@Mapper(config = PosMapperConfig.class)
public interface ScaleProductMapper {

    default ScaleProductDto toDto(WeightProductRef product) {
        if (product == null) {
            return null;
        }
        return new ScaleProductDto(
            product.id(),
            product.sku(),
            product.name(),
            product.plu(),
            product.barcode(),
            product.sellingPrice(),
            SaleType.WEIGHT,
            parseUnit(product.unitCode()),
            product.quantityScale(),
            product.allowFraction(),
            product.active(),
            product.stockQuantity()
        );
    }

    default ScaleProductDto fromProductResponse(ProductResponse response) {
        if (response == null) {
            return null;
        }
        return new ScaleProductDto(
            response.id(),
            response.sku(),
            response.name(),
            response.plu(),
            response.barcode(),
            response.sellingPrice(),
            response.saleType(),
            response.unitCode(),
            response.quantityScale(),
            response.allowFraction(),
            response.active(),
            response.stockQuantity()
        );
    }

    private static UnitCode parseUnit(String unitCode) {
        if (!StringUtils.hasText(unitCode)) {
            return UnitCode.KG;
        }
        try {
            return UnitCode.valueOf(unitCode);
        } catch (IllegalArgumentException ex) {
            return UnitCode.KG;
        }
    }
}
