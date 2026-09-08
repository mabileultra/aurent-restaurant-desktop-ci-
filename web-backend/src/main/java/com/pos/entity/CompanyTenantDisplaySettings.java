package com.pos.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "company_tenant_display_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyTenantDisplaySettings {

    @Id
    @Column(name = "company_id")
    private Integer companyId;

    /** Read-only link; PK is companyId (avoid @MapsId null-identifier on first save). */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private JsonNode settings;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public void bindCompany(Company company) {
        if (company == null || company.getId() == null) {
            throw new IllegalArgumentException("Company with id is required");
        }
        this.company = company;
        this.companyId = company.getId();
    }

    @PrePersist
    @PreUpdate
    void touchUpdatedAt() {
        if (companyId == null && company != null) {
            companyId = company.getId();
        }
        this.updatedAt = Instant.now();
    }
}
