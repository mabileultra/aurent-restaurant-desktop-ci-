package com.pos.integrations.pharmacy.entity;

import com.pos.integrations.pharmacy.domain.AslRequestOperation;
import com.pos.integrations.pharmacy.domain.AslRequestOutcome;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "asl_request_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AslRequestLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "company_id", nullable = false)
  private Integer companyId;

  @Column(name = "store_id", nullable = false)
  private Integer storeId;

  @Enumerated(EnumType.STRING)
  @Column(name = "operation", nullable = false, length = 32)
  private AslRequestOperation operation;

  @Enumerated(EnumType.STRING)
  @Column(name = "outcome", nullable = false, length = 32)
  private AslRequestOutcome outcome;

  @Column(name = "reached", nullable = false)
  private boolean reached;

  @Column(name = "http_status")
  private Integer httpStatus;

  @Column(name = "endpoint", length = 256)
  private String endpoint;

  @Column(name = "mark_code_short", length = 64)
  private String markCodeShort;

  @Column(name = "asl_status", length = 64)
  private String aslStatus;

  @Column(name = "message", length = 500)
  private String message;

  @Column(name = "duration_ms")
  private Integer durationMs;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;
}
