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

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "price_registry_rows")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceRegistryRow {

    @Id
    private UUID id;

    @Column(name = "snapshot_id", nullable = false)
    private UUID snapshotId;

    @Column(name = "pharm_id", length = 64)
    private String pharmId;

    @Column(length = 64)
    private String barcode;

    @Column(name = "trade_name", length = 500)
    private String tradeName;

    @Column(name = "limit_price_vat", nullable = false, precision = 18, scale = 2)
    private BigDecimal limitPriceVat;
}
