package com.pos.platform.service.support;

import com.pos.platform.dto.desktop.DesktopBroadcastCreateRequest;
import com.pos.platform.entity.DesktopBroadcast;
import com.pos.platform.entity.DesktopBroadcastKind;
import com.pos.platform.entity.DesktopBroadcastStatus;
import com.pos.platform.entity.DesktopBroadcastTargetType;
import com.pos.platform.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DesktopBroadcastCreateSupportTest {

    private final DesktopBroadcastCreateSupport support = new DesktopBroadcastCreateSupport();
    private final UUID adminId = UUID.randomUUID();

    @Test
    void buildsAllNowBroadcast() {
        DesktopBroadcastCreateRequest request = new DesktopBroadcastCreateRequest(
            "Title",
            "Body text",
            DesktopBroadcastKind.MESSAGE,
            null,
            null,
            null,
            24,
            "ALL",
            null,
            null,
            "NOW",
            null
        );

        DesktopBroadcast broadcast = support.build(request, adminId);

        assertEquals(DesktopBroadcastTargetType.ALL, broadcast.getTargetType());
        assertEquals(DesktopBroadcastStatus.ACTIVE, broadcast.getStatus());
        assertNull(broadcast.getScheduledAt());
        assertTrue(broadcast.getCompanyIds().isEmpty());
        assertTrue(broadcast.getStoreIds().isEmpty());
        assertTrue(broadcast.getExpiresAt().isAfter(Instant.now().plus(23, ChronoUnit.HOURS)));
    }

    @Test
    void buildsScheduledCompaniesBroadcast() {
        Instant scheduledAt = Instant.now().plus(2, ChronoUnit.HOURS);
        DesktopBroadcastCreateRequest request = new DesktopBroadcastCreateRequest(
            "Title",
            "Body text",
            DesktopBroadcastKind.ALERT,
            1,
            null,
            null,
            12,
            "COMPANIES",
            List.of(10, 20),
            List.of(99),
            "SCHEDULED",
            scheduledAt
        );

        DesktopBroadcast broadcast = support.build(request, adminId);

        assertEquals(DesktopBroadcastTargetType.COMPANIES, broadcast.getTargetType());
        assertEquals(DesktopBroadcastStatus.SCHEDULED, broadcast.getStatus());
        assertEquals(scheduledAt, broadcast.getScheduledAt());
        assertEquals(2, broadcast.getCompanyIds().size());
        assertTrue(broadcast.getStoreIds().isEmpty());
        assertEquals(scheduledAt.plus(12, ChronoUnit.HOURS), broadcast.getExpiresAt());
    }

    @Test
    void rejectsCompaniesWithoutIds() {
        DesktopBroadcastCreateRequest request = new DesktopBroadcastCreateRequest(
            "Title",
            "Body text",
            DesktopBroadcastKind.MESSAGE,
            null,
            null,
            null,
            null,
            "COMPANIES",
            List.of(),
            null,
            "NOW",
            null
        );

        assertThrows(BadRequestException.class, () -> support.build(request, adminId));
    }

    @Test
    void rejectsPastScheduledAt() {
        DesktopBroadcastCreateRequest request = new DesktopBroadcastCreateRequest(
            "Title",
            "Body text",
            DesktopBroadcastKind.MESSAGE,
            null,
            null,
            null,
            null,
            "ALL",
            null,
            null,
            "SCHEDULED",
            Instant.now().minusSeconds(60)
        );

        assertThrows(BadRequestException.class, () -> support.build(request, adminId));
    }
}
