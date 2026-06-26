package com.pos.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "desktop_broadcast_reads")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesktopBroadcastRead {

    @EmbeddedId
    private DesktopBroadcastReadId id;

    @Column(name = "read_at", nullable = false)
    private Instant readAt;

    @PrePersist
    void onCreate() {
        if (readAt == null) {
            readAt = Instant.now();
        }
    }
}
