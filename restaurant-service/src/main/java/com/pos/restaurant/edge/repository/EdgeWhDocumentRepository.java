package com.pos.restaurant.edge.repository;

import com.pos.restaurant.edge.entity.EdgeWhDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface EdgeWhDocumentRepository extends JpaRepository<EdgeWhDocument, UUID> {

    Optional<EdgeWhDocument> findByIdAndCompanyId(UUID id, Integer companyId);

    @Query("""
        select d from EdgeWhDocument d
        where d.companyId = :companyId and d.docType = :docType
          and d.createdAt >= :from and d.createdAt < :to
          and (:storeId is null or d.storeId = :storeId or d.storeId2 = :storeId)
        order by d.createdAt desc
        """)
    Page<EdgeWhDocument> listByType(
        @Param("companyId") Integer companyId,
        @Param("docType") String docType,
        @Param("from") Instant from,
        @Param("to") Instant to,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query("""
        select d from EdgeWhDocument d
        where d.companyId = :companyId and d.docType = 'TRANSFER'
          and d.createdAt >= :from and d.createdAt < :to
          and (:fromStoreId is null or d.storeId = :fromStoreId)
          and (:toStoreId is null or d.storeId2 = :toStoreId)
        order by d.createdAt desc
        """)
    Page<EdgeWhDocument> listTransfers(
        @Param("companyId") Integer companyId,
        @Param("from") Instant from,
        @Param("to") Instant to,
        @Param("fromStoreId") Integer fromStoreId,
        @Param("toStoreId") Integer toStoreId,
        Pageable pageable
    );
}
