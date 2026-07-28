package com.pos.crm.mapper;

import com.pos.crm.dto.customer.CustomerResponse;
import com.pos.crm.entity.Customer;
import com.pos.mapper.PosMapperConfig;
import org.mapstruct.Mapper;

@Mapper(config = PosMapperConfig.class)
public interface CustomerMapper {

    CustomerResponse toResponse(Customer customer);
}
