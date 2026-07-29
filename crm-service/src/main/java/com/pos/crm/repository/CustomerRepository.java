package com.pos.crm.repository;

import com.pos.crm.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID>, JpaSpecificationExecutor<Customer> {

    boolean existsByCompanyIdAndPhone(Integer companyId, String phone);

    boolean existsByCompanyIdAndEmail(Integer companyId, String email);

    Optional<Customer> findByIdAndCompanyId(UUID id, Integer companyId);
}
