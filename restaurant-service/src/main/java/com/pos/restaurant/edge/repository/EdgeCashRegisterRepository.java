package com.pos.restaurant.edge.repository;

import com.pos.restaurant.edge.entity.EdgeCashRegister;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EdgeCashRegisterRepository extends JpaRepository<EdgeCashRegister, Long> {

    Page<EdgeCashRegister> findByCompanyIdAndStoreId(Integer companyId, Integer storeId, Pageable pageable);

    Page<EdgeCashRegister> findByCompanyId(Integer companyId, Pageable pageable);

    List<EdgeCashRegister> findByCompanyIdAndStoreIdOrderByIdAsc(Integer companyId, Integer storeId);

    Optional<EdgeCashRegister> findByIdAndCompanyId(Long id, Integer companyId);

    Optional<EdgeCashRegister> findFirstByCompanyIdOrderByIdDesc(Integer companyId);
}
