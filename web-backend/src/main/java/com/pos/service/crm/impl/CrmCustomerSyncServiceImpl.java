package com.pos.service.crm.impl;

import com.pos.crm.entity.Customer;
import com.pos.crm.repository.CustomerRepository;
import com.pos.dto.crm.internal.CustomerSyncRequest;
import com.pos.entity.Company;
import com.pos.repository.CompanyRepository;
import com.pos.service.crm.CrmCustomerSyncService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CrmCustomerSyncServiceImpl implements CrmCustomerSyncService {

    private final CustomerRepository customerRepository;
    private final CompanyRepository companyRepository;

    @Override
    @Transactional
    public void sync(CustomerSyncRequest request) {
        if (request == null || request.id() == null) {
            return;
        }
        if ("DELETE".equalsIgnoreCase(request.operation())) {
            customerRepository.deleteById(request.id());
            LogUtil.info(CrmCustomerSyncServiceImpl.class, "Customer deleted from pos_db replica: id={}", request.id());
            return;
        }
        upsert(request);
    }

    private void upsert(CustomerSyncRequest request) {
        Company company = request.companyId() != null
            ? companyRepository.findById(request.companyId()).orElse(null)
            : null;
        if (request.companyId() != null && company == null) {
            LogUtil.warn(
                CrmCustomerSyncServiceImpl.class,
                "Customer sync: company not found in pos_db, customer will have no company link: customerId={}, companyId={}",
                request.id(),
                request.companyId()
            );
        }

        Customer customer = customerRepository.findById(request.id())
            .orElseGet(() -> Customer.builder().id(request.id()).build());
        customer.setCompany(company);
        customer.setName(request.name());
        customer.setPhone(request.phone());
        customer.setEmail(request.email());
        customer.setLoyaltyPts(request.loyaltyPts());
        customer.setCreatedAt(request.createdAt());

        customerRepository.save(customer);
        LogUtil.info(CrmCustomerSyncServiceImpl.class, "Customer synced to pos_db replica: id={}, op={}", customer.getId(), request.operation());
    }
}
