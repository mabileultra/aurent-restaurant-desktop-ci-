package com.pos.mapper;

import com.pos.dto.category.CategoryResponse;
import com.pos.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface CategoryMapper {

    @Mapping(target = "businessTypeId", source = "businessType.id")
    @Mapping(target = "businessTypeCode", source = "businessType.code")
    @Mapping(target = "businessTypeName", source = "businessType.name")
    CategoryResponse toResponse(Category category);

    List<CategoryResponse> toResponseList(List<Category> categories);
}
