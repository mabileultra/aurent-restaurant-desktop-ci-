package com.pos.finance.entity;

import com.pos.finance.entity.base.LedgerEntryBase;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "customer_receivable_entries")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerReceivableEntry extends LedgerEntryBase {

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "customer_name")
    private String customerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 32)
    private LedgerEntryType entryType;

    @Column(name = "sale_id")
    private UUID saleId;

    @Column(name = "income_id")
    private UUID incomeId;
}
