package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "business_type_rules")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(BusinessTypeRuleId.class)
public class BusinessTypeRule {

    @Id
    @Column(name = "business_type_id")
    private Integer businessTypeId;

    @Id
    @Column(name = "rule_key", length = 64)
    private String ruleKey;

    @Column(name = "rule_value", nullable = false, length = 200)
    @Builder.Default
    private String ruleValue = "true";
}
