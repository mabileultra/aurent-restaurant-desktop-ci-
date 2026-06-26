package com.pos.repository;

import com.pos.entity.CompanyBusinessType;
import com.pos.entity.CompanyBusinessTypeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CompanyBusinessTypeRepository extends JpaRepository<CompanyBusinessType, CompanyBusinessTypeId> {

    @Query("""
        SELECT cbt FROM CompanyBusinessType cbt
        JOIN FETCH cbt.businessType bt
        WHERE cbt.companyId = :companyId
        ORDER BY cbt.defaultType DESC, bt.sortOrder ASC, bt.code ASC
        """)
    List<CompanyBusinessType> findDetailedByCompanyId(Integer companyId);

    @Query("""
        SELECT cbt FROM CompanyBusinessType cbt
        JOIN FETCH cbt.businessType bt
        WHERE cbt.companyId = :companyId AND cbt.businessTypeId = :businessTypeId
        """)
    Optional<CompanyBusinessType> findByCompanyIdAndBusinessTypeId(Integer companyId, Integer businessTypeId);

    boolean existsByCompanyIdAndBusinessTypeId(Integer companyId, Integer businessTypeId);

    @Modifying
    @Query("DELETE FROM CompanyBusinessType cbt WHERE cbt.companyId = :companyId")
    void deleteByCompanyId(Integer companyId);
}
