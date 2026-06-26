package com.pos.identity.repository;

import com.pos.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    long count();
}
