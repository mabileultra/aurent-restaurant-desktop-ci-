package com.pos.platform.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "desktop_broadcasts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesktopBroadcast {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DesktopBroadcastKind kind;

    @Column(nullable = false)
    @Builder.Default
    private int priority = 0;

    @Column(name = "action_label", length = 100)
    private String actionLabel;

    @Column(name = "action_url", length = 500)
    private String actionUrl;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 32)
    @Builder.Default
    private DesktopBroadcastTargetType targetType = DesktopBroadcastTargetType.ALL;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private DesktopBroadcastStatus status = DesktopBroadcastStatus.ACTIVE;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "desktop_broadcast_companies",
        joinColumns = @JoinColumn(name = "broadcast_id")
    )
    @Column(name = "company_id", nullable = false)
    @Builder.Default
    private Set<Integer> companyIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "desktop_broadcast_stores",
        joinColumns = @JoinColumn(name = "broadcast_id")
    )
    @Column(name = "store_id", nullable = false)
    @Builder.Default
    private Set<Integer> storeIds = new HashSet<>();

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (targetType == null) {
            targetType = DesktopBroadcastTargetType.ALL;
        }
        if (status == null) {
            status = DesktopBroadcastStatus.ACTIVE;
        }
    }
}
