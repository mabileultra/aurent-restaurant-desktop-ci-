package com.pos.config.telegram;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(TelegramBotProperties.class)
public class TelegramBotConfig {
}
