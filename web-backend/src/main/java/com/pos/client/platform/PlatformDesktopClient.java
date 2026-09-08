package com.pos.client.platform;

import com.pos.dto.desktop.DesktopBroadcastListResponse;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PlatformDesktopClient {

    private static final String PLATFORM_SERVICE = "platform-service";

    private final RestClient platformRestClient;

    @CircuitBreaker(name = PLATFORM_SERVICE, fallbackMethod = "listUnreadFallback")
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

    @CircuitBreaker(name = PLATFORM_SERVICE, fallbackMethod = "markReadFallback")
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

    @SuppressWarnings("unused")
    private DesktopBroadcastListResponse listUnreadFallback(UUID userId, Throwable ex) {
        LogUtil.warn(
            PlatformDesktopClient.class,
            "Desktop notifications unread fallback userId={}: {}",
            userId,
            ex != null ? ex.getMessage() : "unknown"
        );
        return new DesktopBroadcastListResponse(List.of(), 0);
    }

    @SuppressWarnings("unused")
    private void markReadFallback(UUID broadcastId, UUID userId, Throwable ex) {
        LogUtil.warn(
            PlatformDesktopClient.class,
            "Desktop notifications markRead fallback id={} userId={}: {}",
            broadcastId,
            userId,
            ex != null ? ex.getMessage() : "unknown"
        );
    }
}
