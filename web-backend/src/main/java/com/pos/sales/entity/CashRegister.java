package com.pos.sales.entity;

import jakarta.persistence.*;
import com.pos.entity.Store;
import com.pos.integrations.fiscal.domain.FiscalProvider;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "cash_registers",
    uniqueConstraints = @UniqueConstraint(columnNames = {"store_id", "register_number"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashRegister {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(name = "register_number", nullable = false)
    private Integer registerNumber;

    @Column(name = "equipment_model", length = 100)
    private String equipmentModel;

    @Column(name = "equipment_serial", length = 100)
    private String equipmentSerial;

    @Column(name = "fiscal_card_id", length = 100)
    private String fiscalCardId;

    /** Уникальный ID desktop/терминала (UUID из Electron или ручной код). */
    @Column(name = "device_id", length = 128)
    private String deviceId;

    @Column(name = "workstation_name", length = 200)
    private String workstationName;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    /** ACTIVE — касса в работе (иконка «старт»), INACTIVE — выключена */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @Enumerated(EnumType.STRING)
    @Column(name = "fiscal_provider", nullable = false, length = 32)
    @Builder.Default
    private FiscalProvider fiscalProvider = FiscalProvider.MULTIKASSA;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (fiscalProvider == null) {
            fiscalProvider = FiscalProvider.MULTIKASSA;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
