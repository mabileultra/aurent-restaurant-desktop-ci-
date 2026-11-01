package com.pos.identity.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class RoleModuleTemplateId implements Serializable {

    @Column(name = "business_type", nullable = false, length = 32)
    private String businessType;

    @Column(name = "role_name", nullable = false, length = 64)
    private String roleName;

    @Column(name = "module_key", nullable = false, length = 64)
    private String moduleKey;
}
