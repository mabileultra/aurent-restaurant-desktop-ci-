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

import java.util.UUID;

@Entity
@Table(name = "drug_registry_entries")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DrugRegistryEntry {

    @Id
    private UUID id;

    @Column(name = "import_id", nullable = false)
    private UUID importId;

    @Column(name = "registration_number", length = 128)
    private String registrationNumber;

    @Column(name = "trade_name", nullable = false, length = 500)
    private String tradeName;

    @Column(name = "name_key", nullable = false, length = 500)
    private String nameKey;

    @Column(length = 500)
    private String inn;

    @Column(name = "dosage_form", length = 255)
    private String dosageForm;

    @Column(length = 500)
    private String manufacturer;

    @Column(length = 255)
    private String country;

    @Column(name = "atc_code", length = 32)
    private String atcCode;

    @Column(name = "prescription_required")
    private Boolean prescriptionRequired;
}
