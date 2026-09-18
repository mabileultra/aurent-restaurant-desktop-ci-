package com.pos.pharmacy.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyAsyncPropertiesTest {

    @Test
    void bindsPoolSizesFromRelaxedNames() {
        MapConfigurationPropertySource source = new MapConfigurationPropertySource(Map.of(
            "app.pharmacy.async.import-pool.core-pool-size", "6",
            "app.pharmacy.async.import-pool.max-pool-size", "12",
            "app.pharmacy.async.mark-verify.queue-capacity", "50"
        ));
        PharmacyAsyncProperties properties = new Binder(source)
            .bind("app.pharmacy.async", Bindable.of(PharmacyAsyncProperties.class))
            .orElseThrow(() -> new IllegalStateException("bind failed"));

        assertEquals(6, properties.getImportPool().getCorePoolSize());
        assertEquals(12, properties.getImportPool().getMaxPoolSize());
        assertEquals(50, properties.getMarkVerify().getQueueCapacity());
    }
}
