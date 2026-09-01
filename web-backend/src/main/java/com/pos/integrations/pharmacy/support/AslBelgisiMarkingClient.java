package com.pos.integrations.pharmacy.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.exception.BadRequestException;
import com.pos.integrations.pharmacy.dto.MarkingVerifyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AslBelgisiMarkingClient {

  private static final String PRIVATE_CODES_PATH = "/public/api/cod/private/codes";
  private static final String PUBLIC_CODES_PATH = "/public/api/cod/public/codes";

  private final RestTemplate pharmacyIntegrationRestTemplate;
  private final ObjectMapper objectMapper;

  public MarkingVerifyResponse verify(String baseUrl, String apiKey, String rawCode) {
    String code = normalizeCode(rawCode);
    if (!StringUtils.hasText(code)) {
      throw new BadRequestException("Marking code is required");
    }

    String resolvedBase = normalizeBaseUrl(baseUrl);
    boolean hasKey = StringUtils.hasText(apiKey);
    String path = hasKey ? PRIVATE_CODES_PATH : PUBLIC_CODES_PATH;

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    if (hasKey) {
      headers.setBearerAuth(apiKey.trim());
    }

    Map<String, Object> body = Map.of("codes", List.of(code));

    try {
      ResponseEntity<String> response = pharmacyIntegrationRestTemplate.exchange(
        resolvedBase + path,
        HttpMethod.POST,
        new HttpEntity<>(body, headers),
        String.class
      );
      return parseResponse(code, response.getBody());
    } catch (HttpStatusCodeException ex) {
      String message = extractErrorMessage(ex.getResponseBodyAsString());
      throw new BadRequestException(
        StringUtils.hasText(message) ? message : "ASL Belgisi API error: " + ex.getStatusCode().value()
      );
    } catch (BadRequestException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new BadRequestException("Failed to reach ASL Belgisi API: " + ex.getMessage());
    }
  }

  private MarkingVerifyResponse parseResponse(String code, String body) {
    if (!StringUtils.hasText(body)) {
      return new MarkingVerifyResponse(false, code, null, null, null, null, null, null, Map.of());
    }

    try {
      JsonNode root = objectMapper.readTree(body);
      JsonNode entry = findCodeEntry(root, code);
      if (entry == null || entry.isMissingNode() || entry.isNull()) {
        return new MarkingVerifyResponse(false, code, null, null, null, null, null, null, Map.of());
      }

      Map<String, Object> details = toFlatMap(entry);
      return new MarkingVerifyResponse(
        true,
        text(entry, "code", "cis", "km"),
        firstText(entry, "status", "codeStatus", "state"),
        firstText(entry, "gtin", "productGtin"),
        firstText(entry, "productName", "product_name", "name"),
        firstText(entry, "expirationDate", "expiration_date", "expDate"),
        firstText(entry, "batch", "batchNumber", "series"),
        firstText(entry, "ownerInn", "owner_inn", "issuerInn"),
        details
      );
    } catch (BadRequestException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new BadRequestException("Unexpected ASL Belgisi response format");
    }
  }

  private JsonNode findCodeEntry(JsonNode root, String code) {
    if (root == null || root.isNull()) {
      return null;
    }
    if (root.isArray()) {
      for (JsonNode item : root) {
        if (matchesCode(item, code)) {
          return item;
        }
      }
      return root.isEmpty() ? null : root.get(0);
    }
    JsonNode codes = root.get("codes");
    if (codes != null && codes.isArray()) {
      for (JsonNode item : codes) {
        if (matchesCode(item, code)) {
          return item;
        }
      }
      return codes.isEmpty() ? null : codes.get(0);
    }
    JsonNode result = root.get("result");
    if (result != null) {
      return findCodeEntry(result, code);
    }
    if (matchesCode(root, code) || root.has("status") || root.has("gtin")) {
      return root;
    }
    return null;
  }

  private boolean matchesCode(JsonNode node, String code) {
    if (node == null) {
      return false;
    }
    String normalized = normalizeCode(code);
    for (String field : List.of("code", "cis", "km", "markingCode")) {
      JsonNode value = node.get(field);
      if (value != null && normalized.equals(normalizeCode(value.asText()))) {
        return true;
      }
    }
    return false;
  }

  private String firstText(JsonNode node, String... fields) {
    for (String field : fields) {
      String value = text(node, field);
      if (StringUtils.hasText(value)) {
        return value;
      }
    }
    return null;
  }

  private String text(JsonNode node, String... fields) {
    for (String field : fields) {
      JsonNode value = node.get(field);
      if (value != null && !value.isNull()) {
        String asText = value.asText();
        if (StringUtils.hasText(asText)) {
          return asText;
        }
      }
    }
    return null;
  }

  private Map<String, Object> toFlatMap(JsonNode node) {
    Map<String, Object> map = new HashMap<>();
    Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
    while (fields.hasNext()) {
      Map.Entry<String, JsonNode> field = fields.next();
      JsonNode value = field.getValue();
      if (value == null || value.isNull()) {
        continue;
      }
      if (value.isValueNode()) {
        map.put(field.getKey(), value.asText());
      } else if (value.isObject() || value.isArray()) {
        map.put(field.getKey(), value.toString());
      }
    }
    return map;
  }

  private String extractErrorMessage(String body) {
    if (!StringUtils.hasText(body)) {
      return null;
    }
    try {
      JsonNode root = objectMapper.readTree(body);
      for (String field : List.of("message", "error", "errorMessage", "detail")) {
        JsonNode value = root.get(field);
        if (value != null && StringUtils.hasText(value.asText())) {
          return value.asText();
        }
      }
    } catch (Exception ignored) {
      return body.length() > 200 ? body.substring(0, 200) : body;
    }
    return null;
  }

  private String normalizeBaseUrl(String baseUrl) {
    String resolved = StringUtils.hasText(baseUrl) ? baseUrl.trim() : PharmacyIntegrationDefaults.ASL_API_BASE_URL;
    while (resolved.endsWith("/")) {
      resolved = resolved.substring(0, resolved.length() - 1);
    }
    return resolved;
  }

  public static String normalizeCode(String raw) {
    if (!StringUtils.hasText(raw)) {
      return "";
    }
    return raw
      .trim()
      .replace("\u001d", "")
      .replace("\u0000", "");
  }
}
