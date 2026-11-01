package com.pos.identity.repository;

import com.pos.identity.entity.RoleModuleTemplate;
import com.pos.identity.entity.RoleModuleTemplateId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoleModuleTemplateRepository extends JpaRepository<RoleModuleTemplate, RoleModuleTemplateId> {

    List<RoleModuleTemplate> findByIdBusinessTypeAndIdRoleName(String businessType, String roleName);

    boolean existsByIdBusinessTypeAndIdRoleName(String businessType, String roleName);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        DELETE FROM RoleModuleTemplate t
        WHERE t.id.businessType = :businessType AND t.id.roleName = :roleName
        """)
    int deleteByBusinessTypeAndRoleName(
        @Param("businessType") String businessType,
        @Param("roleName") String roleName
    );
}
