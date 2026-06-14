package com.pos.finance.entity;

import com.pos.finance.entity.base.UuidIdentifiedEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "finance_audit_logs")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceAuditLog extends UuidIdentifiedEntity {

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 32)
    private FinanceAuditEntityType entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private FinanceAuditAction action;

    @Column(length = 500)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
