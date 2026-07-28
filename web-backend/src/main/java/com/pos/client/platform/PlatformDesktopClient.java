package com.pos.client.platform;

import com.pos.dto.desktop.DesktopBroadcastListResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PlatformDesktopClient {

    private static final String PLATFORM_SERVICE = "platform-service";

    private final RestClient platformRestClient;

    @CircuitBreaker(name = PLATFORM_SERVICE)
    @Retry(name = PLATFORM_SERVICE)
    public DesktopBroadcastListResponse listUnread(UUID userId) {
        return platformRestClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/internal/platform/desktop-notifications/unread")
                .queryParam("userId", userId)
                .build())
            .retrieve()
            .body(DesktopBroadcastListResponse.class);
    }

    @CircuitBreaker(name = PLATFORM_SERVICE)
    @Retry(name = PLATFORM_SERVICE)
    public void markRead(UUID broadcastId, UUID userId) {
        platformRestClient.post()
            .uri(uriBuilder -> uriBuilder
                .path("/internal/platform/desktop-notifications/{id}/read")
                .queryParam("userId", userId)
                .build(broadcastId))
            .retrieve()
            .toBodilessEntity();
    }
}
