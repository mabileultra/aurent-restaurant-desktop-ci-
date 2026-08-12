package com.pos.scales.mapper;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.entity.Product;
import com.pos.mapper.PosMapperConfig;
import com.pos.scales.dto.ScaleProductDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = PosMapperConfig.class)
public interface ScaleProductMapper {

    @Mapping(target = "active", source = "active")
    ScaleProductDto toDto(Product product);

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
}
