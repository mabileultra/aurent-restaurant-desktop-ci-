package com.pos.platform.repository;

import com.pos.platform.domain.SiteLeadStatus;
import com.pos.platform.entity.SiteLead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface SiteLeadRepository extends JpaRepository<SiteLead, UUID> {

    @Query("""
        SELECT l FROM SiteLead l
        WHERE (:status IS NULL OR l.status = :status)
          AND (
            :search IS NULL OR :search = '' OR
            LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(l.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(COALESCE(l.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
        """)
    Page<SiteLead> search(
        @Param("status") SiteLeadStatus status,
        @Param("search") String search,
        Pageable pageable
    );
}
