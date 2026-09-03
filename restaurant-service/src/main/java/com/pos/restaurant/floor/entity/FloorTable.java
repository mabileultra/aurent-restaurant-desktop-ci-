package com.pos.restaurant.floor.entity;

import com.pos.restaurant.floor.domain.TableStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "floor_tables")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hall_id", nullable = false)
    private FloorHall hall;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Column(nullable = false, length = 32)
    private String code;

    @Column(length = 100)
    private String label;

    @Column(name = "seat_count", nullable = false)
    @Builder.Default
    private int seatCount = 4;

    @Column(name = "pos_x", nullable = false)
    @Builder.Default
    private int posX = 0;

    @Column(name = "pos_y", nullable = false)
    @Builder.Default
    private int posY = 0;

    @Column(nullable = false)
    @Builder.Default
    private int width = 80;

    @Column(nullable = false)
    @Builder.Default
    private int height = 80;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    @Builder.Default
    private TableStatus status = TableStatus.FREE;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
