package com.pos.pharmacy.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.pharmacy.tasnif")
public class PharmacyTasnifProperties {

    private boolean enabled = true;
    private String baseUrl = "https://tasnif.soliq.uz/api/cl-api";
    private int connectTimeoutMs = 8000;
    private int readTimeoutMs = 15000;
    private int searchType = 1;
    private String defaultLang = "uz";
}
