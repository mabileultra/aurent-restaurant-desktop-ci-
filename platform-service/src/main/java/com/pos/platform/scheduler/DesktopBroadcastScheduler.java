package com.pos.platform.scheduler;

import com.pos.platform.service.DesktopBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DesktopBroadcastScheduler {

    private final DesktopBroadcastService desktopBroadcastService;

    @Scheduled(fixedDelayString = "${app.desktop-broadcast.activate-delay-ms:60000}")
    public void activateScheduledBroadcasts() {
        desktopBroadcastService.activateDueBroadcasts();
    }
}
