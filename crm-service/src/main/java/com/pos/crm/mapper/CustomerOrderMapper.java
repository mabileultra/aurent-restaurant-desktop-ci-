package com.pos.crm.mapper;

import com.pos.crm.client.dto.CourierRefDto;
import com.pos.crm.dto.order.CourierOptionResponse;
import com.pos.crm.dto.order.CustomerOrderDetailResponse;
import com.pos.crm.dto.order.CustomerOrderRowResponse;
import com.pos.crm.entity.CustomerOrder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(config = CrmMapperConfig.class)
public interface CustomerOrderMapper {

    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    CustomerOrderRowResponse toRowResponse(CustomerOrder order);

    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    CustomerOrderDetailResponse toDetailResponse(CustomerOrder order);

    CourierOptionResponse toCourierOption(CourierRefDto courier);

    List<CourierOptionResponse> toCourierOptionList(List<CourierRefDto> couriers);

    @Named("enumName")
    default String enumName(Enum<?> value) {
        return value != null ? value.name() : null;
    }
}
