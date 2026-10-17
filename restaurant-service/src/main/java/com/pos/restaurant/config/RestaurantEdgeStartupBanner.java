package com.pos.restaurant.config;

import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RestaurantEdgeStartupBanner {

    private final RestaurantEdgeProperties edgeProperties;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        if (!edgeProperties.isEnabled()) {
            return;
        }
        LogUtil.info(
            RestaurantEdgeStartupBanner.class,
            "EDGE mode: Redis off, Kafka off, POS stock deferred to outbox; local Postgres + JWT only"
        );
    }
}
