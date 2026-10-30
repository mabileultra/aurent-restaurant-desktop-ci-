package com.pos.restaurant.order.entity;

import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.order.domain.DeliveryStatus;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.shift.entity.RestaurantShift;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "floor_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private FloorTable table;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    @Builder.Default
    private OrderChannel channel = OrderChannel.DINE_IN;

    @Column(name = "order_no", nullable = false)
    private int orderNo;

    /** Daily cafe handoff number for the open shift. Null until first kitchen send with the module. */
    @Column(name = "pickup_no")
    private Integer pickupNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    @Builder.Default
    private OrderStatus status = OrderStatus.OPEN;

    @Column(name = "guest_count", nullable = false)
    @Builder.Default
    private int guestCount = 1;

    @Column(name = "adult_count", nullable = false)
    @Builder.Default
    private int adultCount = 1;

    @Column(name = "children_count", nullable = false)
    @Builder.Default
    private int childrenCount = 0;

    @Column(name = "client_name", length = 160)
    private String clientName;

    @Column(name = "client_phone", length = 40)
    private String clientPhone;

    @Column(name = "delivery_address", length = 400)
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", length = 24)
    private DeliveryStatus deliveryStatus;

    @Column(name = "opened_by_user_id", nullable = false)
    private UUID openedByUserId;

    @Column(name = "waiter_user_id")
    private UUID waiterUserId;

    /** Optional courier for DELIVERY channel (company user id). */
    @Column(name = "courier_user_id")
    private UUID courierUserId;

    @Column(name = "commission_percent", precision = 6, scale = 2)
    private BigDecimal commissionPercent;

    @Column(name = "commission_base_amount", precision = 18, scale = 2)
    private BigDecimal commissionBaseAmount;

    @Column(name = "commission_amount", precision = 18, scale = 2)
    private BigDecimal commissionAmount;

    @Column(name = "service_percent", precision = 5, scale = 2)
    private BigDecimal servicePercent;

    @Column(name = "service_amount", precision = 18, scale = 2)
    private BigDecimal serviceAmount;

    /** Order-level discount (absolute money), applied at pay time. */
    @Column(name = "discount_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id")
    private RestaurantShift shift;

    @Column(length = 500)
    private String comment;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (openedAt == null) {
            openedAt = now;
        }
        updatedAt = now;
        if (channel == null) {
            channel = OrderChannel.DINE_IN;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
