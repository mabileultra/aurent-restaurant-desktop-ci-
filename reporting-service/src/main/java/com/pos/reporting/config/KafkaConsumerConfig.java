package com.pos.reporting.config;

import com.pos.shared.event.ProductSnapshotEvent;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.event.ShiftClosedEvent;
import com.pos.shared.event.StockInventoryRecordedEvent;
import com.pos.shared.event.StockMovementRecordedEvent;
import com.pos.shared.event.StockReceivedEvent;
import com.pos.shared.event.StockTransferRecordedEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConditionalOnProperty(prefix = "app.kafka.consumer", name = "enabled", havingValue = "true", matchIfMissing = true)
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    private final ReportingKafkaErrorHandlerFactory errorHandlerFactory;

    public KafkaConsumerConfig(ReportingKafkaErrorHandlerFactory errorHandlerFactory) {
        this.errorHandlerFactory = errorHandlerFactory;
    }

    private Map<String, Object> baseConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "reporting-service");
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);
        return config;
    }

    @Bean
    public ConsumerFactory<String, SaleCompletedEvent> saleCompletedConsumerFactory() {
        Map<String, Object> config = baseConfig();
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.pos.shared.event");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, SaleCompletedEvent.class.getName());
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, SaleCompletedEvent> saleCompletedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, SaleCompletedEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(saleCompletedConsumerFactory());
        factory.setCommonErrorHandler(errorHandlerFactory.create());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, StockReceivedEvent> stockReceivedConsumerFactory() {
        Map<String, Object> config = baseConfig();
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.pos.shared.event");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, StockReceivedEvent.class.getName());
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, StockReceivedEvent> stockReceivedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, StockReceivedEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(stockReceivedConsumerFactory());
        factory.setCommonErrorHandler(errorHandlerFactory.create());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, StockMovementRecordedEvent> stockMovementRecordedConsumerFactory() {
        Map<String, Object> config = baseConfig();
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.pos.shared.event");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, StockMovementRecordedEvent.class.getName());
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, StockMovementRecordedEvent> stockMovementRecordedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, StockMovementRecordedEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(stockMovementRecordedConsumerFactory());
        factory.setCommonErrorHandler(errorHandlerFactory.create());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, ProductSnapshotEvent> productSnapshotConsumerFactory() {
        Map<String, Object> config = baseConfig();
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.pos.shared.event");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, ProductSnapshotEvent.class.getName());
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ProductSnapshotEvent> productSnapshotKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ProductSnapshotEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(productSnapshotConsumerFactory());
        factory.setCommonErrorHandler(errorHandlerFactory.create());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, StockInventoryRecordedEvent> stockInventoryRecordedConsumerFactory() {
        Map<String, Object> config = baseConfig();
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.pos.shared.event");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, StockInventoryRecordedEvent.class.getName());
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, StockInventoryRecordedEvent> stockInventoryRecordedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, StockInventoryRecordedEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(stockInventoryRecordedConsumerFactory());
        factory.setCommonErrorHandler(errorHandlerFactory.create());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, StockTransferRecordedEvent> stockTransferRecordedConsumerFactory() {
        Map<String, Object> config = baseConfig();
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.pos.shared.event");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, StockTransferRecordedEvent.class.getName());
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, StockTransferRecordedEvent> stockTransferRecordedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, StockTransferRecordedEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(stockTransferRecordedConsumerFactory());
        factory.setCommonErrorHandler(errorHandlerFactory.create());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, ShiftClosedEvent> shiftClosedConsumerFactory() {
        Map<String, Object> config = baseConfig();
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.pos.shared.event");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, ShiftClosedEvent.class.getName());
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ShiftClosedEvent> shiftClosedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ShiftClosedEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(shiftClosedConsumerFactory());
        factory.setCommonErrorHandler(errorHandlerFactory.create());
        return factory;
    }
}
