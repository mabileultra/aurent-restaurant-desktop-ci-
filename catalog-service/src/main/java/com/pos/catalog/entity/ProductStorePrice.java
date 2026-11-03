package com.pos.catalog.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(
    name = "product_store_prices",
    uniqueConstraints = @UniqueConstraint(name = "uq_psp_product_store", columnNames = {"product_id", "store_id"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductStorePrice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal price;
}
