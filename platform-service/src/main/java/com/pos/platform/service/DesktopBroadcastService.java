package com.pos.platform.service;

import com.pos.platform.dto.desktop.DesktopBroadcastCreateRequest;
import com.pos.platform.dto.desktop.DesktopBroadcastListResponse;
import com.pos.platform.dto.desktop.DesktopBroadcastResponse;
import com.pos.platform.dto.desktop.DesktopBroadcastUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface DesktopBroadcastService {

    DesktopBroadcastResponse broadcast(DesktopBroadcastCreateRequest request);

    DesktopBroadcastListResponse listUnreadForUser(UUID userId);

    List<DesktopBroadcastResponse> listRecentForPlatform();

    void markRead(UUID broadcastId, UUID userId);

    /** Revoke: expire immediately so cashiers no longer see the message. */
    void revoke(UUID broadcastId);

    DesktopBroadcastResponse extend(UUID broadcastId, DesktopBroadcastUpdateRequest request);
}
