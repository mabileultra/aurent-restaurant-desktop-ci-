package com.pos.crm.repository;

import com.pos.crm.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long>, JpaSpecificationExecutor<CustomerOrder> {

    long countByStoreId(Integer storeId);

    boolean existsByCreatedById(UUID userId);
}
