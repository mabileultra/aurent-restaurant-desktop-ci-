package com.pos.pharmacy.sales.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sale_sold_marks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleSoldMark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Column(name = "sale_id", nullable = false)
    private UUID saleId;

    @Column(name = "sale_item_id")
    private UUID saleItemId;

    @Column(name = "mark_code", nullable = false, columnDefinition = "TEXT")
    private String markCode;

    @Column(name = "mark_key", nullable = false, columnDefinition = "TEXT")
    private String markKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
