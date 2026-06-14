package com.pos.finance.entity.base;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@MappedSuperclass
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class StoreCreatedEntity extends CreatedOnlyEntity {

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id")
    private Integer storeId;
}
