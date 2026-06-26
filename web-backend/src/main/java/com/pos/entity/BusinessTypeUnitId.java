package com.pos.entity;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BusinessTypeUnitId implements Serializable {

    private Integer businessTypeId;
    private String unitCode;
}
