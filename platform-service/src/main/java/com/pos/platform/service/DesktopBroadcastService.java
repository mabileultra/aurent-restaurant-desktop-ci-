package com.pos.platform.service;

import com.pos.platform.dto.desktop.DesktopBroadcastCreateRequest;
import com.pos.platform.dto.desktop.DesktopBroadcastListResponse;
import com.pos.platform.dto.desktop.DesktopBroadcastResponse;

import java.util.List;
import java.util.UUID;

public interface DesktopBroadcastService {

    DesktopBroadcastResponse broadcast(DesktopBroadcastCreateRequest request);

    DesktopBroadcastListResponse listUnreadForUser(UUID userId);

    List<DesktopBroadcastResponse> listRecentForPlatform();

    void markRead(UUID broadcastId, UUID userId);
}
