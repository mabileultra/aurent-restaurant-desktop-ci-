package com.pos.finance.entity;

import com.pos.finance.entity.base.LedgerEntryBase;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "supplier_payable_entries")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierPayableEntry extends LedgerEntryBase {

    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    @Column(name = "supplier_name")
    private String supplierName;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 32)
    private LedgerEntryType entryType;

    @Column(name = "receipt_id")
    private UUID receiptId;

    @Column(name = "expense_id")
    private UUID expenseId;
}
