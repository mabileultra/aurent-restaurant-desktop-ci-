package com.pos.crm.service;

import com.pos.crm.dto.customer.CreateCustomerRequest;
import com.pos.crm.dto.customer.CustomerResponse;
import com.pos.crm.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

public interface CustomerService {

    PageResponse<CustomerResponse> list(String search, Pageable pageable);

    CustomerResponse create(CreateCustomerRequest request);
}
