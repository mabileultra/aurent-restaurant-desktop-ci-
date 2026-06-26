package com.pos.entity;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class CompanyBusinessTypeId implements Serializable {

    private Integer companyId;
    private Integer businessTypeId;
}
