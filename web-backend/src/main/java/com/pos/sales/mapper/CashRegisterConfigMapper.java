package com.pos.sales.mapper;

import com.pos.sales.dto.cashregister.CashRegisterConfigRowResponse;
import com.pos.sales.entity.CashRegisterConfig;
import com.pos.mapper.PosMapperConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = PosMapperConfig.class)
public interface CashRegisterConfigMapper {

    @Mapping(target = "storeCount", expression = "java(config.getStores() == null ? 0 : config.getStores().size())")
    @Mapping(target = "registerCount", expression = "java(config.getRegisters() == null ? 0 : config.getRegisters().size())")
    @Mapping(target = "categoryCount", expression = "java(config.getCategories() == null ? 0 : config.getCategories().size())")
    CashRegisterConfigRowResponse toRowResponse(CashRegisterConfig config);
}
