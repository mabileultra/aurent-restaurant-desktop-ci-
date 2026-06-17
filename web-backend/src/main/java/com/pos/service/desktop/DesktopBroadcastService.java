package com.pos.service.desktop;

import com.pos.dto.desktop.DesktopBroadcastCreateRequest;
import com.pos.dto.desktop.DesktopBroadcastListResponse;
import com.pos.dto.desktop.DesktopBroadcastResponse;

import java.util.List;
import java.util.UUID;

public interface DesktopBroadcastService {

    DesktopBroadcastResponse broadcast(DesktopBroadcastCreateRequest request);

    DesktopBroadcastListResponse listUnreadForCurrentUser();

    List<DesktopBroadcastResponse> listRecentForPlatform();

    void markRead(UUID broadcastId);
}
