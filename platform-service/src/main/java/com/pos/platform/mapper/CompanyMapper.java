package com.pos.platform.mapper;

import com.pos.platform.dto.company.CompanyResponse;
import com.pos.platform.entity.Company;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = PlatformMapperConfig.class)
public interface CompanyMapper {

    @Mapping(target = "storeCount", source = "storeCount")
    CompanyResponse toResponse(Company company, int storeCount);
}
