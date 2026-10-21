package com.pos.restaurant.edge.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "edge_pharmacy_integration")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgePharmacyIntegration {

    @Id
    @Column(name = "store_id")
    private Integer storeId;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "asl_marking_enabled", nullable = false)
    @Builder.Default
    private boolean aslMarkingEnabled = false;

    @Column(name = "asl_portal_url", length = 500)
    private String aslPortalUrl;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
