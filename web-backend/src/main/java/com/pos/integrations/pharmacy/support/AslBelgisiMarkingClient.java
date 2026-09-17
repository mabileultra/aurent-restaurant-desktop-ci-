package com.pos.integrations.pharmacy.support;

import com.pos.exception.BadRequestException;
import com.pos.integrations.pharmacy.dto.MarkingVerifyResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AslBelgisiMarkingClient {

  private static final String PRIVATE_CODES_PATH = "/public/api/cod/private/codes";

  private final RestTemplate pharmacyIntegrationRestTemplate;
  private final ObjectMapper objectMapper;

  public MarkingVerifyResponse verify(String baseUrl, String apiKey, String rawCode) {
    List<String> codes = requestCodes(rawCode);
    if (codes.isEmpty()) {
      throw new BadRequestException("Marking code is required");
    }
    String token = AslApiKeySupport.bearerToken(apiKey);
    if (!StringUtils.hasText(token)) {
      throw new BadRequestException("Укажите API-ключ ASL Belgisi в настройках магазина");
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setBearerAuth(token);

    try {
      ResponseEntity<String> response = pharmacyIntegrationRestTemplate.exchange(
        normalizeBaseUrl(baseUrl) + PRIVATE_CODES_PATH,
        HttpMethod.POST,
        new HttpEntity<>(Map.of("codes", codes), headers),
        String.class
      );
      return parser().parse(codes.get(0), response.getBody());
    } catch (HttpStatusCodeException ex) {
      throw new BadRequestException(errorMessage(ex.getStatusCode(), ex.getResponseBodyAsString()));
    } catch (BadRequestException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new BadRequestException("Не удалось связаться с ASL Belgisi");
    }
  }

  private AslBelgisiResponseParser parser() {
    return new AslBelgisiResponseParser(objectMapper);
  }

  private String errorMessage(HttpStatusCode status, String body) {
    if (status.value() == 401 || status.value() == 403) {
      return "ASL Belgisi не принял API-ключ. Проверьте ключ типа bearerToken в настройках магазина.";
    }
    String parsed = parser().errorMessage(body);
    if (StringUtils.hasText(parsed)) {
      return parsed;
    }
    return "ASL Belgisi вернул ошибку " + status.value();
  }

  static List<String> requestCodes(String raw) {
    if (!StringUtils.hasText(raw)) {
      return List.of();
    }
    String trimmed = raw.replace("\uFEFF", "").replace("\u0000", "").trim();
    if (trimmed.startsWith("]") && trimmed.length() > 3) {
      trimmed = trimmed.substring(3).trim();
    }
    LinkedHashSet<String> codes = new LinkedHashSet<>();
    if (StringUtils.hasText(trimmed)) {
      codes.add(trimmed);
    }
    String withoutGs = trimmed.replace("\u001d", "");
    if (StringUtils.hasText(withoutGs)) {
      codes.add(withoutGs);
    }
    return new ArrayList<>(codes);
  }

  private String normalizeBaseUrl(String baseUrl) {
    String resolved = StringUtils.hasText(baseUrl) ? baseUrl.trim() : PharmacyIntegrationDefaults.ASL_API_BASE_URL;
    while (resolved.endsWith("/")) {
      resolved = resolved.substring(0, resolved.length() - 1);
    }
    return resolved;
  }
}
