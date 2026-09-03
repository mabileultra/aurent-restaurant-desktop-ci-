package com.pos.config.restaurant;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.restaurant")
@Getter
@Setter
public class RestaurantInternalProperties {

    private String internalApiKey = "pos-internal-dev-key-change-in-prod";
}
