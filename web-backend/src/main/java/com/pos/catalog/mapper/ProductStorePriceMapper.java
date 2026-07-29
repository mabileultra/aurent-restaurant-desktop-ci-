package com.pos.catalog.mapper;

import com.pos.catalog.dto.product.ProductStorePriceRow;
import com.pos.catalog.entity.ProductStorePrice;
import com.pos.mapper.PosMapperConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface ProductStorePriceMapper {

    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.name")
    ProductStorePriceRow toRow(ProductStorePrice storePrice);

    List<ProductStorePriceRow> toRowList(List<ProductStorePrice> storePrices);
}
