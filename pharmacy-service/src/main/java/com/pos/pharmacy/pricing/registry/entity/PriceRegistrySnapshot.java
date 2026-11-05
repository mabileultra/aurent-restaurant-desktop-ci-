package com.pos.pharmacy.pricing.registry.entity;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "price_registry_snapshots")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceRegistrySnapshot {

    @Id
    private UUID id;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "registry_date")
    private LocalDate registryDate;

    @Column(name = "row_count", nullable = false)
    private int rowCount;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
