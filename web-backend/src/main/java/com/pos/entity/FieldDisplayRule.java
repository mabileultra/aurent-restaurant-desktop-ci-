package com.pos.entity;

import com.pos.domain.businessconfig.FieldDisplayEffect;
import com.pos.domain.businessconfig.FieldDisplayOperator;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "field_display_rules")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldDisplayRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "business_type_id", nullable = false)
    private Integer businessTypeId;

    @Column(name = "target_field_key", nullable = false, length = 64)
    private String targetFieldKey;

    @Column(name = "trigger_field_key", nullable = false, length = 64)
    private String triggerFieldKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FieldDisplayOperator operator = FieldDisplayOperator.EQUALS;

    @Column(name = "trigger_value", length = 200)
    private String triggerValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FieldDisplayEffect effect = FieldDisplayEffect.SHOW;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 100;
}
