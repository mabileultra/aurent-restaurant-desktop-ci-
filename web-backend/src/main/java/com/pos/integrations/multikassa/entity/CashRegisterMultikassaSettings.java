package com.pos.integrations.multikassa.entity;

import com.pos.sales.entity.CashRegister;
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
@Table(name = "cash_register_multikassa_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashRegisterMultikassaSettings {

    @Id
    @Column(name = "cash_register_id")
    private Long cashRegisterId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "cash_register_id")
    private CashRegister cashRegister;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "base_url", nullable = false, length = 512)
    private String baseUrl;

    @Column(name = "terminal_id", length = 128)
    private String terminalId;

    @Column(name = "module_number", length = 128)
    private String moduleNumber;

    @Column(name = "selected_drive_id", length = 128)
    private String selectedDriveId;

    @Column(name = "cashier_name_override", length = 200)
    private String cashierNameOverride;

    @Column(name = "require_before_sale", nullable = false)
    @Builder.Default
    private boolean requireBeforeSale = true;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
