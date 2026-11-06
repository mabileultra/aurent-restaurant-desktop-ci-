package com.pos.pharmacy.warehouse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "stock_transfers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "transfer_number", nullable = false, unique = true, length = 40)
    private String transferNumber;

    @Column(name = "from_store_id", nullable = false)
    private Integer fromStoreId;

    @Column(name = "to_store_id", nullable = false)
    private Integer toStoreId;

    @Column(name = "from_store_name", length = 200)
    private String fromStoreName;

    @Column(name = "to_store_name", length = 200)
    private String toStoreName;

    @Column(name = "source_receipt_id")
    private UUID sourceReceiptId;

    @Column(name = "source_receipt_number", length = 40)
    private String sourceReceiptNumber;

    private String notes;

    @Column(name = "total_quantity", nullable = false, precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal totalQuantity = BigDecimal.ZERO;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "transfer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StockTransferLine> lines = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
