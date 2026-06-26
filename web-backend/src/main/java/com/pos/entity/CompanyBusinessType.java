package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "company_business_types")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(CompanyBusinessTypeId.class)
public class CompanyBusinessType {

    @Id
    @Column(name = "company_id")
    private Integer companyId;

    @Id
    @Column(name = "business_type_id")
    private Integer businessTypeId;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean defaultType = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_type_id", insertable = false, updatable = false)
    private BusinessTypeDefinition businessType;
}
