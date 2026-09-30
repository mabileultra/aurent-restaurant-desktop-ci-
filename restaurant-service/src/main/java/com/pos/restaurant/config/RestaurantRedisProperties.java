package com.pos.restaurant.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.restaurant.redis")
public class RestaurantRedisProperties {

    /** false = Caffeine only; service starts without Redis. */
    private boolean enabled = false;

    private String host = "localhost";

    private int port = 6379;

    private String password = "";

    /** Isolated Redis DB index (pharmacy uses 0). */
    private int database = 2;

    private int connectTimeoutMs = 100;

    private int commandTimeoutMs = 100;

    private int menuTtlSeconds = 600;

    private int floorTtlSeconds = 3;

    private int kitchenBoardTtlSeconds = 30;
}
