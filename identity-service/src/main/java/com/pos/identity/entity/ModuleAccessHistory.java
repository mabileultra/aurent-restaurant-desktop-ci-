package com.pos.identity.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "module_access_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleAccessHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Column(name = "actor_name", length = 255)
    private String actorName;

    @Column(nullable = false, length = 32)
    private String action;

    @Column(name = "target_user_id", nullable = false)
    private UUID targetUserId;

    @Column(name = "target_username", length = 100)
    private String targetUsername;

    @Column(name = "target_full_name", length = 255)
    private String targetFullName;

    @Column(length = 16)
    private String strategy;

    @Column(name = "before_custom", nullable = false)
    private boolean beforeCustom;

    @Column(name = "after_custom", nullable = false)
    private boolean afterCustom;

    @Column(name = "before_modules_json", columnDefinition = "TEXT")
    private String beforeModulesJson;

    @Column(name = "after_modules_json", columnDefinition = "TEXT")
    private String afterModulesJson;

    @Column(name = "reverted_at")
    private Instant revertedAt;

    @Column(name = "reverted_by")
    private UUID revertedBy;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
