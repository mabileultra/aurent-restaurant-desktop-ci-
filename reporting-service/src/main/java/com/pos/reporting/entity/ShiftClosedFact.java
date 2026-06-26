package com.pos.reporting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "shift_closed_facts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftClosedFact {

    @Id
    private Long zReportId;

    @Column(nullable = false)
    private UUID shiftId;

    private Integer companyId;
    private Integer storeId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal totalSales;

    @Column(nullable = false)
    private LocalDate businessDate;

    private Integer zNumber;

    @Column(length = 255)
    private String storeName;

    private Instant closedAt;

    private Integer salesCount;

    @Column(length = 255)
    private String employeeName;

    @Column(nullable = false)
    private Instant ingestedAt;
}
