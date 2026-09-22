package com.pos.integrations.pharmacy.support;

import com.pos.integrations.pharmacy.domain.AslRequestOperation;
import com.pos.integrations.pharmacy.domain.AslRequestOutcome;
import lombok.Getter;

/**
 * Контекст одной логической операции к ASL (verify/withdraw) в текущем потоке.
 */
@Getter
public final class AslRequestLogCallContext {

  private final Integer companyId;
  private final Integer storeId;
  private final AslRequestOperation operation;
  private final String markCode;
  private final long startedAtMs;

  private Integer httpStatus;
  private String endpoint;
  private AslRequestOutcome outcome;
  private String aslStatus;
  private String message;

  public AslRequestLogCallContext(
      Integer companyId,
      Integer storeId,
      AslRequestOperation operation,
      String markCode
  ) {
    this.companyId = companyId;
    this.storeId = storeId;
    this.operation = operation;
    this.markCode = markCode;
    this.startedAtMs = System.currentTimeMillis();
  }

  public void noteHttp(Integer status, String endpointPath) {
    if (status != null) {
      this.httpStatus = status;
    }
    if (endpointPath != null && !endpointPath.isBlank()) {
      this.endpoint = shortenEndpoint(endpointPath);
    }
  }

  public void finish(AslRequestOutcome outcome, String aslStatus, String message) {
    this.outcome = outcome;
    this.aslStatus = aslStatus;
    this.message = message;
  }

  public int durationMs() {
    return (int) Math.min(Integer.MAX_VALUE, System.currentTimeMillis() - startedAtMs);
  }

  private static String shortenEndpoint(String endpointPath) {
    String value = endpointPath.trim();
    int idx = value.indexOf("/public/");
    if (idx >= 0) {
      value = value.substring(idx);
    }
    if (value.length() > 256) {
      return value.substring(0, 256);
    }
    return value;
  }
}
