package com.pos.restaurant.edge.repository;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.entity.EdgeProductId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EdgeProductRepository extends JpaRepository<EdgeProduct, EdgeProductId> {

    List<EdgeProduct> findByCompanyIdAndStoreId(Integer companyId, Integer storeId);

    Page<EdgeProduct> findByCompanyIdAndStoreIdAndActiveTrue(Integer companyId, Integer storeId, Pageable pageable);

    @Query("""
        select p from EdgeProduct p
        where p.companyId = :companyId and p.storeId = :storeId
          and (:activeOnly = false or p.active = true)
          and (:search is null or lower(p.name) like lower(concat('%', :search, '%'))
               or lower(coalesce(p.sku, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(p.barcode, '')) like lower(concat('%', :search, '%')))
          and (:barcode is null or p.barcode = :barcode)
          and (:marked is null or p.markedProduct = :marked)
        order by p.name asc
        """)
    Page<EdgeProduct> searchWarehouse(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("search") String search,
        @Param("barcode") String barcode,
        @Param("marked") Boolean marked,
        @Param("activeOnly") boolean activeOnly,
        Pageable pageable
    );

    @Query("""
        select p from EdgeProduct p
        where p.companyId = :companyId and p.storeId = :storeId
          and (:activeOnly = false or p.active = true)
          and (:search is null or lower(p.name) like lower(concat('%', :search, '%'))
               or lower(coalesce(p.sku, '')) like lower(concat('%', :search, '%'))
               or lower(coalesce(p.barcode, '')) like lower(concat('%', :search, '%')))
        order by p.name asc
        """)
    Page<EdgeProduct> search(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("search") String search,
        @Param("activeOnly") boolean activeOnly,
        Pageable pageable
    );

    Optional<EdgeProduct> findByIdAndCompanyIdAndStoreId(UUID id, Integer companyId, Integer storeId);

    Optional<EdgeProduct> findByIdAndCompanyId(UUID id, Integer companyId);

    Optional<EdgeProduct> findByCompanyIdAndStoreIdAndBarcode(Integer companyId, Integer storeId, String barcode);

    long countByCompanyIdAndStoreId(Integer companyId, Integer storeId);
}
