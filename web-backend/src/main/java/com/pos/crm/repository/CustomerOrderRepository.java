package com.pos.crm.repository;

import com.pos.crm.entity.CustomerOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long>, JpaSpecificationExecutor<CustomerOrder> {

    long countByStore_Id(Integer storeId);

    boolean existsByCreatedBy_Id(UUID userId);

    @EntityGraph(attributePaths = {"store", "createdBy", "courier"})
    Page<CustomerOrder> findAll(Specification<CustomerOrder> spec, Pageable pageable);
}
