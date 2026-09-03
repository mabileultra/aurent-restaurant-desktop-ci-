package com.pos.restaurant.modifier.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "modifier_options")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModifierOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ModifierGroup group;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "price_delta", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal priceDelta = BigDecimal.ZERO;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 100;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
