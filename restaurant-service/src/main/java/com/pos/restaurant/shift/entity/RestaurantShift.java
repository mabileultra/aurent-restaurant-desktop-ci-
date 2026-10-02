package com.pos.restaurant.shift.entity;

import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "restaurant_shifts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantShift {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private RestaurantShiftStatus status = RestaurantShiftStatus.OPEN;

    @Column(name = "opened_by_user_id", nullable = false)
    private UUID openedByUserId;

    @Column(name = "closed_by_user_id")
    private UUID closedByUserId;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "opening_cash", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal openingCash = BigDecimal.ZERO;

    @Column(name = "closing_cash", precision = 18, scale = 2)
    private BigDecimal closingCash;

    /** Last closed shift's counted cash; null when this is the first shift. */
    @Column(name = "handover_expected", precision = 18, scale = 2)
    private BigDecimal handoverExpected;

    /** openingCash − handoverExpected; null when there was nothing to confirm. */
    @Column(name = "handover_diff", precision = 18, scale = 2)
    private BigDecimal handoverDiff;

    @Column(name = "sale_count", nullable = false)
    @Builder.Default
    private int saleCount = 0;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "cash_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal cashAmount = BigDecimal.ZERO;

    @Column(name = "card_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal cardAmount = BigDecimal.ZERO;

    @Column(length = 500)
    private String comment;

    @PrePersist
    void prePersist() {
        if (openedAt == null) {
            openedAt = Instant.now();
        }
        if (status == null) {
            status = RestaurantShiftStatus.OPEN;
        }
        if (openingCash == null) {
            openingCash = BigDecimal.ZERO;
        }
        if (totalAmount == null) {
            totalAmount = BigDecimal.ZERO;
        }
        if (cashAmount == null) {
            cashAmount = BigDecimal.ZERO;
        }
        if (cardAmount == null) {
            cardAmount = BigDecimal.ZERO;
        }
    }
}
