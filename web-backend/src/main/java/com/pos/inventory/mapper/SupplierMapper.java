package com.pos.inventory.mapper;

import com.pos.inventory.dto.supplier.SupplierResponse;
import com.pos.inventory.entity.Supplier;
import com.pos.mapper.PosMapperConfig;
import org.mapstruct.Mapper;

@Mapper(config = PosMapperConfig.class)
public interface SupplierMapper {

    SupplierResponse toResponse(Supplier supplier);
}
