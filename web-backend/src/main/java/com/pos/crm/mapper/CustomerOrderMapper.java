package com.pos.crm.mapper;

import com.pos.crm.dto.order.CourierOptionResponse;
import com.pos.crm.dto.order.CustomerOrderDetailResponse;
import com.pos.crm.dto.order.CustomerOrderRowResponse;
import com.pos.crm.entity.CustomerOrder;
import com.pos.entity.User;
import com.pos.mapper.PosMapperConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface CustomerOrderMapper {

    @Mapping(target = "storeName", source = "store.name")
    @Mapping(target = "courierName", source = "courier.fullName")
    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    CustomerOrderRowResponse toRowResponse(CustomerOrder order);

    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.name")
    @Mapping(target = "courierId", source = "courier.id")
    @Mapping(target = "courierName", source = "courier.fullName")
    @Mapping(target = "status", source = "status", qualifiedByName = "enumName")
    CustomerOrderDetailResponse toDetailResponse(CustomerOrder order);

    CourierOptionResponse toCourierOption(User user);

    List<CourierOptionResponse> toCourierOptionList(List<User> users);

    @Named("enumName")
    default String enumName(Enum<?> value) {
        return value != null ? value.name() : null;
    }
}
