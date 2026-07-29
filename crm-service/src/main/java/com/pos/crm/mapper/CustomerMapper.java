package com.pos.crm.mapper;

import com.pos.crm.dto.customer.CustomerResponse;
import com.pos.crm.entity.Customer;
import org.mapstruct.Mapper;

@Mapper(config = CrmMapperConfig.class)
public interface CustomerMapper {

    CustomerResponse toResponse(Customer customer);
}
