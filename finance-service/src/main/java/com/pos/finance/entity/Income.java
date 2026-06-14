package com.pos.finance.entity;

import com.pos.finance.entity.base.MonetaryMovementEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "incomes")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Income extends MonetaryMovementEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "income_category_id", nullable = false)
    private IncomeCategory incomeCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 64)
    private IncomeSourceType sourceType;

    @Column(name = "source_id", length = 64)
    private String sourceId;

    @Column(name = "customer_id")
    private UUID customerId;
}
