package com.pos.identity.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "role_module_templates")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleModuleTemplate {

    @EmbeddedId
    private RoleModuleTemplateId id;

    @Column(name = "allowed", nullable = false)
    private boolean allowed;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @PrePersist
    @PreUpdate
    void touch() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
}
