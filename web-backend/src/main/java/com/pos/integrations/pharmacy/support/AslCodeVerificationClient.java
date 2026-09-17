package com.pos.integrations.pharmacy.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Open API 9.4 — провалидировать массив полных КМ
 * POST /public/api/v1/code-verification/verify
 * Тело: JSON-массив полных кодов (с GS / AI 91|92|93).
 */
@Component
@RequiredArgsConstructor
public class AslCodeVerificationClient {

  private static final String VERIFY_PATH = "/public/api/v1/code-verification/verify";

  private final RestTemplate pharmacyIntegrationRestTemplate;
  private final ObjectMapper objectMapper;

  /**
   * @return true / false по ответу ASL; null — метод недоступен или ошибка (не блокируем кассу)
   */
  public Boolean verifyFullCode(String baseUrl, String bearerToken, String rawCode) {
    String fullCode = AslMarkingCodeNormalizer.fullCodeForVerification(rawCode);
    if (!StringUtils.hasText(fullCode) || !StringUtils.hasText(bearerToken)) {
      return null;
    }
    try {
      HttpHeaders headers = bearerHeaders(bearerToken);
      ResponseEntity<String> response = pharmacyIntegrationRestTemplate.exchange(
        normalizeBaseUrl(baseUrl) + VERIFY_PATH,
        HttpMethod.POST,
        new HttpEntity<>(List.of(fullCode), headers),
        String.class
      );
      return parseVerified(fullCode, response.getBody());
    } catch (Exception ignored) {
      return null;
    }
  }

  private Boolean parseVerified(String requested, String body) {
    if (!StringUtils.hasText(body)) {
      return null;
    }
    try {
      JsonNode root = objectMapper.readTree(body);
      if (!root.isArray()) {
        return null;
      }
      for (JsonNode item : root) {
        if (item == null || !item.isObject()) {
          continue;
        }
        JsonNode verified = item.get("verified");
        if (verified == null || !verified.isBoolean()) {
          continue;
        }
        return verified.asBoolean();
      }
      return null;
    } catch (Exception ex) {
      return null;
    }
  }

  private HttpHeaders bearerHeaders(String token) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setAccept(List.of(MediaType.APPLICATION_JSON));
    headers.setBearerAuth(token);
    return headers;
  }

  private String normalizeBaseUrl(String baseUrl) {
    String resolved = StringUtils.hasText(baseUrl) ? baseUrl.trim() : PharmacyIntegrationDefaults.ASL_API_BASE_URL;
    while (resolved.endsWith("/")) {
      resolved = resolved.substring(0, resolved.length() - 1);
    }
    return resolved;
  }
}
