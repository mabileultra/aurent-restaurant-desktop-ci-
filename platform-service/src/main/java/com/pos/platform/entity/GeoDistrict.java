package com.pos.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "geo_districts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoDistrict {

    @Id
    @Column(length = 16)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "region_code", nullable = false)
    private GeoRegion region;

    @Column(name = "name_ru", nullable = false, length = 200)
    private String nameRu;

    @Column(name = "name_uz", nullable = false, length = 200)
    private String nameUz;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active = true;
}
