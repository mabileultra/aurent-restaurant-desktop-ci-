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

/**
 * ASL Belgisi Open API v1.45 — проверка КМ на кассе аптеки.
 * 1) code-verification/verify — подлинность полного КМ (мягко)
 * 2) public/private codes — статус / GTIN (КИ без криптохвоста)
 * 3) product-registry search-by-gtin?productGroup=pharma — название
 */
@Component
@RequiredArgsConstructor
public class AslBelgisiMarkingClient {

  private static final String PUBLIC_CODES_PATH = "/public/api/cod/public/codes";
  private static final String PRIVATE_CODES_PATH = "/public/api/cod/private/codes";

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
    Boolean cryptoVerified = codeVerificationClient.verifyFullCode(root, token, rawCode);

    HttpHeaders headers = bearerHeaders(token);
    Map<String, Object> body = Map.of(
      "codes", codes,
      "addCodeHistory", Boolean.FALSE,
      "addChildCodes", Boolean.FALSE
    );

    try {
      MarkingVerifyResponse publicResult = exchangeParse(root + PUBLIC_CODES_PATH, headers, body, codes.get(0));
      MarkingVerifyResponse info = publicResult;
      if (!info.found()) {
        try {
          MarkingVerifyResponse privateResult = exchangeParse(root + PRIVATE_CODES_PATH, headers, body, codes.get(0));
          if (privateResult.found()) {
            info = privateResult;
          }
        } catch (BadRequestException privateEx) {
          if (!publicResult.found()) {
            throw privateEx;
          }
        }
      }

      if (!info.found()) {
        return withCryptoFlag(info, cryptoVerified);
      }

      info = withCryptoFlag(info, cryptoVerified);
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
      throw new BadRequestException("Не удалось связаться с ASL Belgisi");
    }
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
