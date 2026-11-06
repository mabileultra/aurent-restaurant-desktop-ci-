package com.pos.idempotency.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "api_idempotency_records")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiIdempotencyRecord {

    @Id
    @Column(name = "idempotency_key", length = 64, nullable = false)
    private String idempotencyKey;

    @Column(nullable = false, length = 160)
    private String scope;

    @Column(name = "request_hash", nullable = false, length = 64)
    private String requestHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status;

    @Column(name = "response_status")
    private Integer responseStatus;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public enum Status {
        IN_PROGRESS,
        COMPLETED
    }
}
