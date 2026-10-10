package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "stores")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "region_code", length = 8)
    private String regionCode;

    @Column(name = "district_code", length = 16)
    private String districtCode;

    @Column(length = 50)
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "business_type", nullable = false, length = 32)
    @Builder.Default
    private String businessType = "UNIVERSAL";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_type_id")
    private BusinessTypeDefinition businessTypeDefinition;

    @Column(name = "is_active")
    private boolean active = true;
}
