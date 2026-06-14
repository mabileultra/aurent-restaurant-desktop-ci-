package com.pos.finance.entity;

import com.pos.finance.entity.base.StoreCreatedEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "account_transfers")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class AccountTransfer extends StoreCreatedEntity {

    @Column(name = "from_account_id", nullable = false)
    private UUID fromAccountId;

    @Column(name = "from_account_name")
    private String fromAccountName;

    @Column(name = "to_account_id", nullable = false)
    private UUID toAccountId;

    @Column(name = "to_account_name")
    private String toAccountName;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 8)
    private String currency;

    @Column(length = 1000)
    private String comment;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @PrePersist
    void prePersist() {
        if (transactionDate == null) {
            transactionDate = LocalDate.now();
        }
    }
}
