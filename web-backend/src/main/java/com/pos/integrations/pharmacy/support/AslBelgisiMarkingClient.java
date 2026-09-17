package com.pos.integrations.pharmacy.support;

import com.pos.exception.BadRequestException;
import com.pos.integrations.pharmacy.dto.MarkingVerifyResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * ASL Belgisi Open API v1.45 — проверка КМ на кассе.
 * Сначала public/private codes (быстро), crypto-verify и registry — мягко, без блокировки кассы.
 */
@Component
@RequiredArgsConstructor
public class AslBelgisiMarkingClient {

  private static final String PUBLIC_CODES_PATH = "/public/api/cod/public/codes";
  private static final String PRIVATE_CODES_PATH = "/public/api/cod/private/codes";
  private static final Pattern GTIN_AI = Pattern.compile("(?:^|[^0-9])01(\\d{14})");

  private final RestTemplate pharmacyIntegrationRestTemplate;
  private final ObjectMapper objectMapper;
  private final AslCodeVerificationClient codeVerificationClient;
  private final AslPharmaProductNameClient productNameClient;

  public MarkingVerifyResponse verify(String baseUrl, String apiKey, String rawCode) {
    List<String> codes = AslMarkingCodeNormalizer.requestCodes(rawCode);
    if (codes.isEmpty()) {
      throw new BadRequestException("Marking code is required");
    }
    String token = AslApiKeySupport.bearerToken(apiKey);
    if (!StringUtils.hasText(token)) {
      throw new BadRequestException("Укажите API-ключ ASL Belgisi в настройках магазина");
    }

    String root = normalizeBaseUrl(baseUrl);
    String localGtin = extractGtin(rawCode);
    HttpHeaders headers = bearerHeaders(token);
    Map<String, Object> body = Map.of(
      "codes", codes,
      "addCodeHistory", Boolean.FALSE,
      "addChildCodes", Boolean.FALSE
    );

    try {
      MarkingVerifyResponse info = exchangeParse(root + PUBLIC_CODES_PATH, headers, body, codes.get(0));
      if (!info.found()) {
        try {
          MarkingVerifyResponse privateResult = exchangeParse(root + PRIVATE_CODES_PATH, headers, body, codes.get(0));
          if (privateResult.found()) {
            info = privateResult;
          }
        } catch (BadRequestException ignored) {
          // public пустой / нет прав на private — не валим кассу
        }
      }

      if (!info.found()) {
        Boolean crypto = codeVerificationClient.verifyFullCode(root, token, rawCode);
        return softMiss(codes.get(0), localGtin, crypto);
      }

      if (!StringUtils.hasText(info.gtin()) && StringUtils.hasText(localGtin)) {
        info = copyWithGtin(info, localGtin);
      }

      Boolean crypto = codeVerificationClient.verifyFullCode(root, token, rawCode);
      info = withCryptoFlag(info, crypto);

      if (!StringUtils.hasText(info.productName()) && StringUtils.hasText(info.gtin())) {
        String name = productNameClient.findProductName(root, token, info.gtin());
        if (StringUtils.hasText(name)) {
          info = new MarkingVerifyResponse(
            info.found(),
            info.code(),
            info.status(),
            info.gtin(),
            name,
            info.expirationDate(),
            info.batch(),
            info.ownerInn(),
            info.details(),
            info.alreadySold()
          );
        }
      }
      return info;
    } catch (BadRequestException ex) {
      throw ex;
    } catch (Exception ex) {
      if (StringUtils.hasText(localGtin)) {
        return softMiss(codes.get(0), localGtin, null);
      }
      throw new BadRequestException("Не удалось связаться с ASL Belgisi");
    }
  }

  private MarkingVerifyResponse softMiss(String code, String gtin, Boolean cryptoVerified) {
    Map<String, Object> details = new HashMap<>();
    if (cryptoVerified != null) {
      details.put("cryptoVerified", cryptoVerified);
    }
    return new MarkingVerifyResponse(
      false,
      code,
      null,
      gtin,
      null,
      null,
      null,
      null,
      details,
      false
    );
  }

  private MarkingVerifyResponse copyWithGtin(MarkingVerifyResponse info, String gtin) {
    return new MarkingVerifyResponse(
      info.found(),
      info.code(),
      info.status(),
      gtin,
      info.productName(),
      info.expirationDate(),
      info.batch(),
      info.ownerInn(),
      info.details(),
      info.alreadySold()
    );
  }

  static String extractGtin(String raw) {
    if (!StringUtils.hasText(raw)) {
      return null;
    }
    String value = raw.replace("\uFEFF", "").replace("\u0000", "").trim();
    Matcher matcher = GTIN_AI.matcher(value);
    if (matcher.find()) {
      return matcher.group(1);
    }
    if (value.length() >= 16 && value.startsWith("01") && value.substring(2, 16).chars().allMatch(Character::isDigit)) {
      return value.substring(2, 16);
    }
    return null;
  }

  private MarkingVerifyResponse withCryptoFlag(MarkingVerifyResponse info, Boolean cryptoVerified) {
    if (cryptoVerified == null) {
      return info;
    }
    Map<String, Object> details = new HashMap<>(info.details() == null ? Map.of() : info.details());
    details.put("cryptoVerified", cryptoVerified);
    return new MarkingVerifyResponse(
      info.found(),
      info.code(),
      info.status(),
      info.gtin(),
      info.productName(),
      info.expirationDate(),
      info.batch(),
      info.ownerInn(),
      details,
      info.alreadySold()
    );
  }

  private MarkingVerifyResponse exchangeParse(
    String url,
    HttpHeaders headers,
    Map<String, Object> body,
    String requestedCode
  ) {
    try {
      ResponseEntity<String> response = pharmacyIntegrationRestTemplate.exchange(
        url,
        HttpMethod.POST,
        new HttpEntity<>(body, headers),
        String.class
      );
      if (response.getStatusCode().is3xxRedirection() && response.getHeaders().getLocation() != null) {
        return followRedirect(response.getHeaders().getLocation(), headers, body, requestedCode);
      }
      return parser().parse(requestedCode, response.getBody());
    } catch (HttpStatusCodeException ex) {
      if (ex.getStatusCode().value() == 307 && ex.getResponseHeaders() != null
        && ex.getResponseHeaders().getLocation() != null) {
        return followRedirect(ex.getResponseHeaders().getLocation(), headers, body, requestedCode);
      }
      throw new BadRequestException(errorMessage(ex.getStatusCode(), ex.getResponseBodyAsString()));
    }
  }

  private MarkingVerifyResponse followRedirect(
    URI location,
    HttpHeaders headers,
    Map<String, Object> body,
    String requestedCode
  ) {
    String target = location.isAbsolute()
      ? location.toString()
      : normalizeBaseUrl(PharmacyIntegrationDefaults.ASL_API_BASE_URL) + location;
    ResponseEntity<String> redirected = pharmacyIntegrationRestTemplate.exchange(
      target,
      HttpMethod.POST,
      new HttpEntity<>(body, headers),
      String.class
    );
    return parser().parse(requestedCode, redirected.getBody());
  }

  private HttpHeaders bearerHeaders(String token) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setAccept(List.of(MediaType.APPLICATION_JSON));
    headers.setBearerAuth(token);
    return headers;
  }

  private AslBelgisiResponseParser parser() {
    return new AslBelgisiResponseParser(objectMapper);
  }

  private String errorMessage(HttpStatusCode status, String body) {
    if (status.value() == HttpStatus.UNAUTHORIZED.value() || status.value() == HttpStatus.FORBIDDEN.value()) {
      return "ASL Belgisi не принял API-ключ. Нужен Bearer apiKey бизнес-пользователя (Open API).";
    }
    String parsed = parser().errorMessage(body);
    if (StringUtils.hasText(parsed)) {
      return parsed;
    }
    return "ASL Belgisi вернул ошибку " + status.value();
  }

  private String normalizeBaseUrl(String baseUrl) {
    String resolved = StringUtils.hasText(baseUrl) ? baseUrl.trim() : PharmacyIntegrationDefaults.ASL_API_BASE_URL;
    while (resolved.endsWith("/")) {
      resolved = resolved.substring(0, resolved.length() - 1);
    }
    return resolved;
  }
}
