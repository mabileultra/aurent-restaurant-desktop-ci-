package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "business_type_units")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(BusinessTypeUnitId.class)
public class BusinessTypeUnit {

    @Id
    @Column(name = "business_type_id")
    private Integer businessTypeId;

    @Id
    @Column(name = "unit_code", length = 16)
    private String unitCode;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean defaultUnit = false;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 100;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_code", insertable = false, updatable = false)
    private Unit unit;
}
