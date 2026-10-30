package com.pos.restaurant.edge.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "edge_cash_registers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgeCashRegister {

    @Id
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Column(name = "register_number")
    private Integer registerNumber;

    @Column(name = "equipment_model", length = 200)
    private String equipmentModel;

    @Column(name = "equipment_serial", length = 120)
    private String equipmentSerial;

    @Column(name = "fiscal_card_id", length = 120)
    private String fiscalCardId;

    @Column(name = "device_id", length = 120)
    private String deviceId;

    @Column(name = "workstation_name", length = 200)
    private String workstationName;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
