package com.pos.restaurant.edge.repository;

import com.pos.restaurant.edge.entity.EdgeStore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EdgeStoreRepository extends JpaRepository<EdgeStore, Integer> {

    Optional<EdgeStore> findByIdAndCompanyId(Integer id, Integer companyId);

    List<EdgeStore> findByCompanyIdAndActiveTrueOrderByNameAsc(Integer companyId);

    List<EdgeStore> findByCompanyIdOrderByNameAsc(Integer companyId);

    long countByCompanyId(Integer companyId);
}
