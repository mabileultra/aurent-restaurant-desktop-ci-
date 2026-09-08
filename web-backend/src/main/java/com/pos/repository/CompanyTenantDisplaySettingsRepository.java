package com.pos.repository;

import com.pos.entity.CompanyTenantDisplaySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CompanyTenantDisplaySettingsRepository extends JpaRepository<CompanyTenantDisplaySettings, Integer> {

    Optional<CompanyTenantDisplaySettings> findByCompanyId(Integer companyId);

    /**
     * Read settings as text to avoid Hibernate jsonb → JsonNode mapping failures
     * turning a simple branding GET into HTTP 500.
     */
    @Query(value = """
        SELECT settings::text
        FROM company_tenant_display_settings
        WHERE company_id = :companyId
        """, nativeQuery = true)
    Optional<String> findSettingsJsonByCompanyId(@Param("companyId") Integer companyId);
}
