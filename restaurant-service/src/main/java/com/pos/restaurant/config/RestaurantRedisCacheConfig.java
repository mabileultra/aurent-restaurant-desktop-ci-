package com.pos.restaurant.config;

import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import io.lettuce.core.TimeoutOptions;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.Map;

/** Shared Redis cache for multi-replica restaurant-service. */
@Configuration
@EnableCaching
@EnableConfigurationProperties(RestaurantRedisProperties.class)
@ConditionalOnProperty(prefix = "app.restaurant.redis", name = "enabled", havingValue = "true")
public class RestaurantRedisCacheConfig {

    @Bean
    public LettuceConnectionFactory restaurantRedisConnectionFactory(RestaurantRedisProperties properties) {
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
    public CacheManager cacheManager(
        LettuceConnectionFactory restaurantRedisConnectionFactory,
        RestaurantRedisProperties properties
    ) {
        RestaurantRedisValueSerializer values = new RestaurantRedisValueSerializer();

        RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
            .disableCachingNullValues()
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(values));

        Map<String, RedisCacheConfiguration> caches = Map.of(
            RestaurantCacheNames.MENU,
            base.entryTtl(Duration.ofSeconds(Math.max(60, properties.getMenuTtlSeconds()))),
            RestaurantCacheNames.FLOOR,
            base.entryTtl(Duration.ofSeconds(Math.max(1, properties.getFloorTtlSeconds()))),
            RestaurantCacheNames.KITCHEN_BOARD,
            base.entryTtl(Duration.ofSeconds(Math.max(5, properties.getKitchenBoardTtlSeconds())))
        );

        return RedisCacheManager.builder(restaurantRedisConnectionFactory)
            .cacheDefaults(base.entryTtl(Duration.ofSeconds(30)))
            .withInitialCacheConfigurations(caches)
            .build();
    }
}
