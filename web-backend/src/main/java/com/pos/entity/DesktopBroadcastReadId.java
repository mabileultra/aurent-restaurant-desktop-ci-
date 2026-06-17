package com.pos.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class DesktopBroadcastReadId implements Serializable {

    @Column(name = "broadcast_id", nullable = false)
    private UUID broadcastId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;
}
