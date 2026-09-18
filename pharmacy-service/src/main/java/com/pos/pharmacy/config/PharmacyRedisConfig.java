package com.pos.pharmacy.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.pos.pharmacy.catalog.dto.ProductResponse;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import io.lettuce.core.TimeoutOptions;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.util.StringUtils;

import java.time.Duration;

@Configuration
@EnableConfigurationProperties(PharmacyRedisProperties.class)
@ConditionalOnProperty(prefix = "app.pharmacy.redis", name = "enabled", havingValue = "true")
public class PharmacyRedisConfig {

    @Bean
    public LettuceConnectionFactory pharmacyRedisConnectionFactory(PharmacyRedisProperties properties) {
        RedisStandaloneConfiguration standalone = new RedisStandaloneConfiguration();
        standalone.setHostName(properties.getHost());
        standalone.setPort(properties.getPort());
        standalone.setDatabase(properties.getDatabase());
        if (StringUtils.hasText(properties.getPassword())) {
            standalone.setPassword(RedisPassword.of(properties.getPassword()));
        }

        Duration connectTimeout = Duration.ofMillis(Math.max(50, properties.getConnectTimeoutMs()));
        Duration commandTimeout = Duration.ofMillis(Math.max(50, properties.getCommandTimeoutMs()));

        SocketOptions socketOptions = SocketOptions.builder()
            .connectTimeout(connectTimeout)
            .build();
        ClientOptions clientOptions = ClientOptions.builder()
            .socketOptions(socketOptions)
            .timeoutOptions(TimeoutOptions.enabled(commandTimeout))
            .autoReconnect(true)
            .build();

        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
            .clientOptions(clientOptions)
            .commandTimeout(commandTimeout)
            .build();

        LettuceConnectionFactory factory = new LettuceConnectionFactory(standalone, clientConfig);
        factory.setValidateConnection(false);
        return factory;
    }

    @Bean
    public RedisTemplate<String, ProductResponse> productResponseRedisTemplate(
        LettuceConnectionFactory pharmacyRedisConnectionFactory
    ) {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        Jackson2JsonRedisSerializer<ProductResponse> valueSerializer =
            new Jackson2JsonRedisSerializer<>(mapper, ProductResponse.class);

        RedisTemplate<String, ProductResponse> template = new RedisTemplate<>();
        template.setConnectionFactory(pharmacyRedisConnectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(valueSerializer);
        template.setHashValueSerializer(valueSerializer);
        template.afterPropertiesSet();
        return template;
    }
}
