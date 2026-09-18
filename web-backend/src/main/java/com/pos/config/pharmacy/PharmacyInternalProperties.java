package com.pos.config.pharmacy;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.pharmacy")
@Getter
@Setter
public class PharmacyInternalProperties {

  private String internalApiKey = "pos-internal-dev-key-change-in-prod";
}
