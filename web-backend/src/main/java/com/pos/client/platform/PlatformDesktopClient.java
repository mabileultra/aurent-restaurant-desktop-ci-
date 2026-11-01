package com.pos.client.platform;

import com.pos.dto.desktop.DesktopBroadcastListResponse;
import com.pos.shared.log.LogUtil;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriBuilder;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PlatformDesktopClient {

    private static final String PLATFORM_SERVICE = "platform-service";

    private final RestClient platformRestClient;

    @CircuitBreaker(name = PLATFORM_SERVICE, fallbackMethod = "listUnreadFallback")
    @Retry(name = PLATFORM_SERVICE)
    public DesktopBroadcastListResponse listUnread(
        UUID userId,
        Integer companyId,
        Collection<Integer> storeIds
    ) {
        return platformRestClient.get()
            .uri(uriBuilder -> buildUnreadUri(uriBuilder, userId, companyId, storeIds))
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

    private static java.net.URI buildUnreadUri(
        UriBuilder uriBuilder,
        UUID userId,
        Integer companyId,
        Collection<Integer> storeIds
    ) {
        uriBuilder
            .path("/internal/platform/desktop-notifications/unread")
            .queryParam("userId", userId);
        if (companyId != null) {
            uriBuilder.queryParam("companyId", companyId);
        }
        if (storeIds != null) {
            for (Integer storeId : storeIds) {
                if (storeId != null) {
                    uriBuilder.queryParam("storeIds", storeId);
                }
            }
        }
        return uriBuilder.build();
    }

    @SuppressWarnings("unused")
    private DesktopBroadcastListResponse listUnreadFallback(
        UUID userId,
        Integer companyId,
        Collection<Integer> storeIds,
        Throwable ex
    ) {
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
