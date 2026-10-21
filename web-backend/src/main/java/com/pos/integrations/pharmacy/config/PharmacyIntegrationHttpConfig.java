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

  @Bean
  public RestTemplate pharmacyIntegrationRestTemplate(
      RestTemplateBuilder builder,
      PharmacyAslAsyncProperties properties
  ) {
    int connectMs = Math.max(500, properties.getConnectTimeoutMs());
    int readMs = Math.max(1_000, properties.getReadTimeoutMs());

    RequestConfig requestConfig = RequestConfig.custom()
      .setConnectTimeout(Timeout.ofMilliseconds(connectMs))
      .setConnectionRequestTimeout(Timeout.ofMilliseconds(connectMs))
      .setResponseTimeout(Timeout.ofMilliseconds(readMs))
      .build();

    var httpClient = HttpClients.custom()
      .setDefaultRequestConfig(requestConfig)
      // ASL отвечает 307 на другой хост. Авто-редирект HttpClient снимает Authorization,
      // и живой ключ приходит обратно как 401.
      .disableRedirectHandling()
      .build();

    HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory(httpClient);

    return builder
      .requestFactory(() -> requestFactory)
      .build();
  }
}
