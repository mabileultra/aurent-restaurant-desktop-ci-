package com.pos.restaurant.order.entity;

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
@Table(name = "floor_order_item_modifiers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorOrderItemModifier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private FloorOrderItem orderItem;

    @Column(name = "option_id")
    private UUID optionId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "price_delta", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal priceDelta = BigDecimal.ZERO;
}
