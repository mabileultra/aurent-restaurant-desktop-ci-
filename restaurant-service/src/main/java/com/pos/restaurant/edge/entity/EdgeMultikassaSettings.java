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
@Table(name = "edge_multikassa")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgeMultikassaSettings {

    @Id
    @Column(name = "store_id")
    private Integer storeId;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "cash_register_id")
    private Long cashRegisterId;

    @Column(name = "base_url", length = 500)
    private String baseUrl;

    @Column(name = "terminal_id", length = 120)
    private String terminalId;

    @Column(name = "module_number", length = 120)
    private String moduleNumber;

    @Column(name = "selected_drive_id", length = 120)
    private String selectedDriveId;

    @Column(name = "cashier_name_override", length = 200)
    private String cashierNameOverride;

    @Column(name = "require_before_sale", nullable = false)
    @Builder.Default
    private boolean requireBeforeSale = false;

    @Column(name = "print_fiscal_qr", nullable = false)
    @Builder.Default
    private boolean printFiscalQr = true;

    @Column(name = "fiscal_provider", length = 32)
    @Builder.Default
    private String fiscalProvider = "MULTIKASSA";

    @Column(name = "factory_id", length = 120)
    private String factoryId;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
