package com.pos.restaurant.commission.repository;

import com.pos.restaurant.commission.entity.WaiterCommissionSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WaiterCommissionSettingRepository extends JpaRepository<WaiterCommissionSetting, UUID> {

    @Query("""
        select s from WaiterCommissionSetting s
        where s.companyId = :companyId and s.storeId = :storeId and s.userId is null
        """)
    Optional<WaiterCommissionSetting> findStoreDefault(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId
    );

    @Query("""
        select s from WaiterCommissionSetting s
        where s.companyId = :companyId and s.storeId = :storeId and s.userId = :userId
        """)
    Optional<WaiterCommissionSetting> findByStoreAndUser(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("userId") UUID userId
    );

    @Query("""
        select s from WaiterCommissionSetting s
        where s.companyId = :companyId and s.storeId = :storeId and s.userId is not null
        order by s.updatedAt desc
        """)
    List<WaiterCommissionSetting> findOverrides(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        delete from WaiterCommissionSetting s
        where s.companyId = :companyId and s.storeId = :storeId and s.userId is not null
        """)
    int deleteOverrides(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId
    );

    /** One round-trip for pay hot-path: store default + optional waiter override. */
    @Query("""
        select s from WaiterCommissionSetting s
        where s.companyId = :companyId and s.storeId = :storeId
          and (s.userId is null or s.userId = :userId)
        """)
    List<WaiterCommissionSetting> findDefaultAndOverride(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("userId") UUID userId
    );
}
