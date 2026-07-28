package com.pos.crm.repository;

import com.pos.crm.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID>, JpaSpecificationExecutor<Customer> {

    boolean existsByCompany_IdAndPhone(Integer companyId, String phone);

    boolean existsByCompany_IdAndEmail(Integer companyId, String email);

    Optional<Customer> findByIdAndCompany_Id(UUID id, Integer companyId);
}
