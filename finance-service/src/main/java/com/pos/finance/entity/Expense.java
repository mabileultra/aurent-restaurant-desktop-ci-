package com.pos.finance.entity;

import com.pos.finance.entity.base.MonetaryMovementEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "expenses")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Expense extends MonetaryMovementEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expense_category_id", nullable = false)
    private ExpenseCategory expenseCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 64)
    private ExpenseSourceType sourceType;

    @Column(name = "source_id", length = 64)
    private String sourceId;

    @Column(name = "supplier_id")
    private UUID supplierId;

    @Column(name = "employee_id")
    private UUID employeeId;
}
