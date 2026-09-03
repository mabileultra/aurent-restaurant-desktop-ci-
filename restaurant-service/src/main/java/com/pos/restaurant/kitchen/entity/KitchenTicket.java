package com.pos.restaurant.kitchen.entity;

import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.order.entity.FloorOrder;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "kitchen_tickets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KitchenTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private FloorOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private KitchenStation station;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    @Builder.Default
    private KitchenTicketStatus status = KitchenTicketStatus.NEW;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @BatchSize(size = 32)
    @OneToMany(mappedBy = "ticket", fetch = FetchType.LAZY)
    @Builder.Default
    private List<KitchenTicketLine> lines = new ArrayList<>();

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (sentAt == null) {
            sentAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
