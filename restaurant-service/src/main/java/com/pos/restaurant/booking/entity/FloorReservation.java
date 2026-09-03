package com.pos.restaurant.booking.entity;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.floor.entity.FloorTable;
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
import java.util.UUID;

@Entity
@Table(name = "floor_reservations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "table_id", nullable = false)
    private FloorTable table;

    @Column(name = "client_name", nullable = false, length = 255)
    private String clientName;

    @Column(name = "client_phone", length = 40)
    private String clientPhone;

    @Column(name = "guest_count", nullable = false)
    @Builder.Default
    private int guestCount = 1;

    @Column(name = "reserved_at", nullable = false)
    private Instant reservedAt;

    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private int durationMinutes = 120;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(name = "created_by_user_id")
    private UUID createdByUserId;

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
