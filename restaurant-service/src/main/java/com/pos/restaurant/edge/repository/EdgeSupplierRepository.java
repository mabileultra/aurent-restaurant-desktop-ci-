package com.pos.restaurant.edge.repository;

import com.pos.restaurant.edge.entity.EdgeSupplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface EdgeSupplierRepository extends JpaRepository<EdgeSupplier, UUID> {

    Optional<EdgeSupplier> findByIdAndCompanyId(UUID id, Integer companyId);

    @Query("""
        select s from EdgeSupplier s
        where s.companyId = :companyId and s.active = true
          and (:search is null or lower(s.name) like lower(concat('%', :search, '%')))
        order by s.name asc
        """)
    Page<EdgeSupplier> search(
        @Param("companyId") Integer companyId,
        @Param("search") String search,
        Pageable pageable
    );
}
