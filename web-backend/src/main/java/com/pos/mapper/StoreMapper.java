package com.pos.mapper;

import com.pos.dto.store.StoreResponse;
import com.pos.entity.Store;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface StoreMapper {

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "businessTypeId", source = "businessTypeDefinition.id")
    @Mapping(target = "businessType", expression = "java(resolveBusinessTypeCode(store))")
    StoreResponse toResponse(Store store);

    default String resolveBusinessTypeCode(Store store) {
        if (store.getBusinessTypeDefinition() != null) {
            return store.getBusinessTypeDefinition().getCode();
        }
        return store.getBusinessType() != null
            ? store.getBusinessType()
            : com.pos.domain.businessconfig.BusinessTypeCodes.UNIVERSAL;
    }

    List<StoreResponse> toResponseList(List<Store> stores);
}
