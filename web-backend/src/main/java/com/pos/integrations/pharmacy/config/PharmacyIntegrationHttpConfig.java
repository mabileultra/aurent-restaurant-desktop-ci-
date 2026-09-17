package com.pos.integrations.pharmacy.config;

import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.util.Timeout;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class PharmacyIntegrationHttpConfig {

  private static final int CONNECT_TIMEOUT_MS = 3_000;
  private static final int READ_TIMEOUT_MS = 5_000;

  @Bean
  public RestTemplate pharmacyIntegrationRestTemplate(RestTemplateBuilder builder) {
    RequestConfig requestConfig = RequestConfig.custom()
      .setConnectTimeout(Timeout.ofMilliseconds(CONNECT_TIMEOUT_MS))
      .setConnectionRequestTimeout(Timeout.ofMilliseconds(CONNECT_TIMEOUT_MS))
      .setResponseTimeout(Timeout.ofMilliseconds(READ_TIMEOUT_MS))
      .build();

    var httpClient = HttpClients.custom()
      .setDefaultRequestConfig(requestConfig)
      .build();

    HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory(httpClient);

    return builder
      .requestFactory(() -> requestFactory)
      .build();
  }
}
