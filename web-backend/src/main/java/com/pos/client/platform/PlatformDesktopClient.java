package com.pos.client.platform;

import com.pos.dto.desktop.DesktopBroadcastListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PlatformDesktopClient {

    private final RestClient platformRestClient;

    public DesktopBroadcastListResponse listUnread(UUID userId) {
        return platformRestClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/internal/platform/desktop-notifications/unread")
                .queryParam("userId", userId)
                .build())
            .retrieve()
            .body(DesktopBroadcastListResponse.class);
    }

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
