package com.pos.support.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(SupportContactsProperties.class)
public class SupportContactsConfig {
}
