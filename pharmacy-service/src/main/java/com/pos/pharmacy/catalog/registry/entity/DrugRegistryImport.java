package com.pos.pharmacy.catalog.registry.entity;

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
import java.util.UUID;

@Entity
@Table(name = "drug_registry_imports")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DrugRegistryImport {

    public static final String STATUS_READY = "READY";

    @Id
    private UUID id;

    @Column(length = 1000)
    private String source;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(nullable = false, length = 64)
    private String checksum;

    @Column(name = "row_count", nullable = false)
    private int rowCount;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
