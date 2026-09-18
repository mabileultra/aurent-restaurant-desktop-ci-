package com.pos.pharmacy.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.pharmacy.redis")
public class PharmacyRedisProperties {

    /**
     * Выключатель без деплоя кода. false = NoOp кэш, сервис стартует без Redis.
     */
    private boolean enabled = false;

    private String host = "localhost";

    private int port = 6379;

    private String password = "";

    /** Индекс БД Redis (изолируем pharmacy от будущих сервисов). */
    private int database = 0;

    private int connectTimeoutMs = 100;

    private int commandTimeoutMs = 100;

    /** TTL кэша barcode → product для кассы. */
    private int barcodeTtlSeconds = 180;
}
