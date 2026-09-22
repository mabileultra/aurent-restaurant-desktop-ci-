package com.pos.restaurant.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "floor_order_merges")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorOrderMerge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "primary_order_id", nullable = false)
    private UUID primaryOrderId;

    @Column(name = "secondary_order_id", nullable = false)
    private UUID secondaryOrderId;

    @Column(name = "primary_table_id", nullable = false)
    private Integer primaryTableId;

    @Column(name = "secondary_table_id", nullable = false)
    private Integer secondaryTableId;

    @Column(name = "merged_by_user_id")
    private UUID mergedByUserId;

    @Column(name = "merged_at", nullable = false)
    private Instant mergedAt;

    @PrePersist
    void prePersist() {
        if (mergedAt == null) {
            mergedAt = Instant.now();
        }
    }
}
