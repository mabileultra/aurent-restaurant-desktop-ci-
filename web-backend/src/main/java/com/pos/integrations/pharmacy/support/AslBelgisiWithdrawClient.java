package com.pos.integrations.pharmacy.support;

import com.pos.integrations.pharmacy.dto.MarkingVerifyResponse;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawItemResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Подтверждение вывода КМ в ASL Belgisi.
 * Розничный вывод в УЗ идёт через фискальный чек (ОФД → ASL);
 * Open API используем для идемпотентной проверки статуса (WITHDRAWN).
 */
@Component
@RequiredArgsConstructor
public class AslBelgisiWithdrawClient {

  private final AslBelgisiMarkingClient markingClient;

  public MarkingWithdrawItemResult confirm(
      String baseUrl,
      String apiKey,
      String rawCode,
      boolean fiscalConfirmed
  ) {
    if (!StringUtils.hasText(rawCode)) {
      return MarkingWithdrawItemResult.fail(rawCode, "Пустой код маркировки");
    }
    try {
      MarkingVerifyResponse info = markingClient.verify(baseUrl, apiKey, rawCode);
      if (info.alreadySold() || AslMarkingCirculation.alreadySold(info.status(), info.details())) {
        return MarkingWithdrawItemResult.ok(rawCode, info.status() != null ? info.status() : "WITHDRAWN");
      }
      if (fiscalConfirmed) {
        // Чек уже ушёл в ОФД — локально считаем вывод принятым, ASL догонит статусом.
        return MarkingWithdrawItemResult.ok(rawCode, "FISCAL_SUBMITTED");
      }
      String status = info.status() != null ? info.status() : (info.found() ? "INTRODUCED" : "UNKNOWN");
      return MarkingWithdrawItemResult.waiting(
          rawCode,
          status,
          "Ожидаем вывод через ОФД / ASL"
      );
    } catch (Exception ex) {
      if (fiscalConfirmed) {
        return MarkingWithdrawItemResult.ok(rawCode, "FISCAL_SUBMITTED");
      }
      String message = ex.getMessage() != null ? ex.getMessage() : "ASL withdraw check failed";
      return MarkingWithdrawItemResult.fail(rawCode, message);
    }
  }
}
