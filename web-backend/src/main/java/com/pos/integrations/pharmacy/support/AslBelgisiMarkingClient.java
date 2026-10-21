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
  private final AslRequestLogCallScope requestLogCallScope;

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
      // Публичный codes часто оставляет INTRODUCED после розницы. «Уже пробита» — в private.
      if (!info.alreadySold()) {
        try {
          MarkingVerifyResponse privateResult = exchangeParse(root + PRIVATE_CODES_PATH, headers, body, codes.get(0));
          if (privateResult.found() && (privateResult.alreadySold() || !info.found())) {
            info = privateResult;
          }
        } catch (BadRequestException ignored) {
          // нет прав на private — остаётся публичный ответ
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
      requestLogCallScope.noteHttp(response.getStatusCode().value(), url);
      if (isRedirect(response.getStatusCode()) && response.getHeaders().getLocation() != null) {
        return followRedirect(response.getHeaders().getLocation(), headers, body, requestedCode);
      }
      return parser().parse(requestedCode, response.getBody());
    } catch (HttpStatusCodeException ex) {
      requestLogCallScope.noteHttp(ex.getStatusCode().value(), url);
      if (isRedirect(ex.getStatusCode()) && ex.getResponseHeaders() != null
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
    if (!aslHost(target)) {
      throw new BadRequestException("ASL Belgisi перенаправил запрос на неизвестный адрес");
    }
    try {
      ResponseEntity<String> redirected = pharmacyIntegrationRestTemplate.exchange(
        target,
        HttpMethod.POST,
        new HttpEntity<>(body, headers),
        String.class
      );
      requestLogCallScope.noteHttp(redirected.getStatusCode().value(), target);
      return parser().parse(requestedCode, redirected.getBody());
    } catch (HttpStatusCodeException ex) {
      requestLogCallScope.noteHttp(ex.getStatusCode().value(), target);
      throw new BadRequestException(errorMessage(ex.getStatusCode(), ex.getResponseBodyAsString()));
    }
  }

  private static boolean isRedirect(HttpStatusCode status) {
    int code = status.value();
    return code == 301 || code == 302 || code == 307 || code == 308;
  }

  private static boolean aslHost(String url) {
    try {
      String host = URI.create(url).getHost();
      return host != null && host.toLowerCase(java.util.Locale.ROOT).endsWith("aslbelgisi.uz");
    } catch (IllegalArgumentException ex) {
      return false;
    }
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
      String parsed = parser().errorMessage(body);
      if (inactiveToken(parsed)) {
        return "ASL Belgisi не принял API-ключ: он не активен. В xTrace действует только один ключ бизнес-пользователя — создайте новый и снова сохраните его в настройках магазина.";
      }
      return "ASL Belgisi не принял API-ключ. Нужен Bearer apiKey бизнес-пользователя (Open API).";
    }
    String parsed = parser().errorMessage(body);
    if (StringUtils.hasText(parsed)) {
      return parsed;
    }
    return "ASL Belgisi вернул ошибку " + status.value();
  }

  private static boolean inactiveToken(String parsed) {
    if (!StringUtils.hasText(parsed)) {
      return false;
    }
    String text = parsed.toLowerCase(java.util.Locale.ROOT).replace('\u2019', '\'');
    return text.contains("isn't active")
      || text.contains("invalid_token")
      || text.contains("не актив");
  }

  private String normalizeBaseUrl(String baseUrl) {
    String resolved = StringUtils.hasText(baseUrl) ? baseUrl.trim() : PharmacyIntegrationDefaults.ASL_API_BASE_URL;
    while (resolved.endsWith("/")) {
      resolved = resolved.substring(0, resolved.length() - 1);
    }
    return resolved;
  }
}
