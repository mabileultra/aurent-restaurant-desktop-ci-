package com.pos.identity.repository;

import com.pos.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN FETCH u.role
        LEFT JOIN FETCH u.storeIds
        WHERE u.id = :id
        """)
    Optional<User> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.storeIds")
    List<User> findAllWithDetails();

    @Query("""
        SELECT DISTINCT u FROM User u
        JOIN FETCH u.role
        LEFT JOIN FETCH u.storeIds
        WHERE u.companyId = :companyId AND u.role.name <> 'SUPER_ADMIN'
        ORDER BY u.fullName
        """)
    List<User> findByCompanyIdWithDetails(@Param("companyId") Integer companyId);

    @Query("""
        SELECT DISTINCT u FROM User u
        JOIN FETCH u.role
        LEFT JOIN FETCH u.storeIds
        WHERE u.role.name <> 'SUPER_ADMIN'
          AND u.companyId IS NOT NULL
          AND (:companyId IS NULL OR u.companyId = :companyId)
        """)
    List<User> findTenantUsersForModuleAccess(@Param("companyId") Integer companyId);

    @Query("""
        SELECT DISTINCT u FROM User u
        JOIN FETCH u.role
        LEFT JOIN FETCH u.storeIds
        WHERE u.role.name = 'PLATFORM_ADMIN'
          AND u.companyId IS NULL
        """)
    List<User> findPlatformOperatorsForModuleAccess();

    @Query("""
        SELECT DISTINCT u FROM User u
        JOIN FETCH u.role
        LEFT JOIN FETCH u.storeIds sid
        WHERE u.companyId = :companyId
          AND u.isActive = true
          AND u.role.name <> 'SUPER_ADMIN'
          AND EXISTS (
            SELECT 1 FROM User u2 JOIN u2.storeIds s
            WHERE u2.id = u.id AND s = :storeId
          )
        ORDER BY u.fullName
        """)
    List<User> findActiveByCompanyIdAndStoreId(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT DISTINCT u FROM User u
        JOIN FETCH u.role
        WHERE u.companyId = :companyId
          AND u.isActive = true
          AND u.pinDigest IS NOT NULL
          AND u.role.name IN :roles
        ORDER BY u.fullName
        """)
    List<User> findActivePinRoster(
        @Param("companyId") Integer companyId,
        @Param("roles") Collection<String> roles
    );

    long count();
}
