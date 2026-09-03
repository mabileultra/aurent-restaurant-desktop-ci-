package com.pos.restaurant.revenue.config;

import com.pos.shared.kafka.FinanceIntegrationMessage;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConditionalOnProperty(prefix = "app.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)
public class RestaurantKafkaProducerConfig {

    @Bean
    public ProducerFactory<String, Object> restaurantDomainEventProducerFactory(RestaurantKafkaProperties properties) {
        return new DefaultKafkaProducerFactory<>(baseConfig(properties));
    }

    @Bean
    public KafkaTemplate<String, Object> restaurantDomainEventKafkaTemplate(
        ProducerFactory<String, Object> restaurantDomainEventProducerFactory
    ) {
        return new KafkaTemplate<>(restaurantDomainEventProducerFactory);
    }

    @Bean
    public ProducerFactory<String, FinanceIntegrationMessage> restaurantFinanceProducerFactory(
        RestaurantKafkaProperties properties
    ) {
        return new DefaultKafkaProducerFactory<>(baseConfig(properties));
    }

    @Bean
    public KafkaTemplate<String, FinanceIntegrationMessage> restaurantFinanceKafkaTemplate(
        ProducerFactory<String, FinanceIntegrationMessage> restaurantFinanceProducerFactory
    ) {
        return new KafkaTemplate<>(restaurantFinanceProducerFactory);
    }

    private static Map<String, Object> baseConfig(RestaurantKafkaProperties properties) {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, properties.getBootstrapServers());
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        config.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);
        return config;
    }
}
