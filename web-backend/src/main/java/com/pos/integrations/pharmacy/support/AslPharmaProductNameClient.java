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
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Iterator;
import java.util.List;

/**
 * Open API 10.2 — название товара по GTIN (аптека: productGroup=pharma).
 * GET /public/api/v1/product-registry/product/search-by-gtin
 */
@Component
@RequiredArgsConstructor
public class AslPharmaProductNameClient {

  private static final String SEARCH_BY_GTIN_PATH = "/public/api/v1/product-registry/product/search-by-gtin";

  private final RestTemplate pharmacyIntegrationRestTemplate;
  private final ObjectMapper objectMapper;

  public String findProductName(String baseUrl, String bearerToken, String gtin) {
    if (!StringUtils.hasText(gtin) || !StringUtils.hasText(bearerToken)) {
      return null;
    }
    try {
      String url = UriComponentsBuilder
        .fromUriString(normalizeBaseUrl(baseUrl) + SEARCH_BY_GTIN_PATH)
        .queryParam("gtin", gtin.trim())
        .queryParam("productGroup", PharmacyIntegrationDefaults.ASL_PHARMA_PRODUCT_GROUP)
        .queryParam("status", "PUBLISHED")
        .queryParam("limit", 1)
        .build(true)
        .toUriString();

      HttpHeaders headers = new HttpHeaders();
      headers.setAccept(List.of(MediaType.APPLICATION_JSON));
      headers.setBearerAuth(bearerToken);

      ResponseEntity<String> response = pharmacyIntegrationRestTemplate.exchange(
        url,
        HttpMethod.GET,
        new HttpEntity<>(headers),
        String.class
      );
      return parseName(response.getBody());
    } catch (Exception ignored) {
      return null;
    }
  }

  private String parseName(String body) {
    if (!StringUtils.hasText(body)) {
      return null;
    }
    try {
      JsonNode root = objectMapper.readTree(body);
      JsonNode products = root.get("products");
      if (products == null || !products.isArray() || products.isEmpty()) {
        return null;
      }
      JsonNode first = products.get(0);
      if (first == null) {
        return null;
      }
      return localizedName(first.get("productName"));
    } catch (Exception ex) {
      return null;
    }
  }

  static String localizedName(JsonNode nameNode) {
    if (nameNode == null || nameNode.isNull()) {
      return null;
    }
    if (nameNode.isTextual()) {
      return nameNode.asText();
    }
    if (!nameNode.isObject()) {
      return null;
    }
    for (String lang : List.of("ru", "uz", "en")) {
      JsonNode value = nameNode.get(lang);
      if (value != null && value.isTextual() && StringUtils.hasText(value.asText())) {
        return value.asText();
      }
    }
    Iterator<JsonNode> values = nameNode.elements();
    while (values.hasNext()) {
      JsonNode value = values.next();
      if (value != null && value.isTextual() && StringUtils.hasText(value.asText())) {
        return value.asText();
      }
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
}
