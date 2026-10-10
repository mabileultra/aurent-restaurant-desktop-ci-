package com.pos.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "geo_regions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoRegion {

    @Id
    @Column(length = 8)
    private String code;

    @Column(name = "name_ru", nullable = false, length = 200)
    private String nameRu;

    @Column(name = "name_uz", nullable = false, length = 200)
    private String nameUz;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active = true;
}
