package com.pos.repository;

import com.pos.entity.BusinessTypeUnit;
import com.pos.entity.BusinessTypeUnitId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BusinessTypeUnitRepository extends JpaRepository<BusinessTypeUnit, BusinessTypeUnitId> {

    @Query("""
        SELECT btu FROM BusinessTypeUnit btu
        JOIN FETCH btu.unit u
        WHERE btu.businessTypeId = :businessTypeId
        ORDER BY btu.defaultUnit DESC, btu.sortOrder ASC, u.code ASC
        """)
    List<BusinessTypeUnit> findDetailedByBusinessTypeId(Integer businessTypeId);

    @Modifying
    @Query("DELETE FROM BusinessTypeUnit btu WHERE btu.businessTypeId = :businessTypeId")
    void deleteByBusinessTypeId(Integer businessTypeId);
}
