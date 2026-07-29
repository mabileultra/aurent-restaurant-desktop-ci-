package com.pos.crm.entity;

import com.pos.entity.Company;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "customers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    /**
     * Assigned, not generated: this table is now a read replica synced from crm-service
     * (see CrmCustomerSyncServiceImpl) — the id always comes from the sync source, same as
     * {@link com.pos.entity.User#getId()}.
     */
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String name;

    private String phone;

    private String email;

    @Column(name = "loyalty_pts")
    private int loyaltyPts;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
