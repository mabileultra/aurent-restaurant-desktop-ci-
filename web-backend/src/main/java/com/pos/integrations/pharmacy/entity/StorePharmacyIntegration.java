package com.pos.integrations.pharmacy.entity;

import com.pos.entity.Store;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "store_pharmacy_integration")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorePharmacyIntegration {

    @Id
    @Column(name = "store_id")
    private Integer storeId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(name = "asl_enabled", nullable = false)
    private boolean aslEnabled;

    @Column(name = "asl_api_base_url", length = 512)
    private String aslApiBaseUrl;

    @Column(name = "asl_api_key", columnDefinition = "TEXT")
    private String aslApiKey;

    @Column(name = "dmed_enabled", nullable = false)
    private boolean dmedEnabled;

    @Column(name = "dmed_external_id", length = 128)
    private String dmedExternalId;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
