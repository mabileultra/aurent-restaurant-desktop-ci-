package com.pos.platform.repository;

import com.pos.platform.entity.DesktopBroadcast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface DesktopBroadcastRepository extends JpaRepository<DesktopBroadcast, UUID> {

    @Query("""
        SELECT b FROM DesktopBroadcast b
        WHERE (b.expiresAt IS NULL OR b.expiresAt > :now)
          AND b.id NOT IN (
            SELECT r.id.broadcastId FROM DesktopBroadcastRead r WHERE r.id.userId = :userId
          )
        ORDER BY b.priority DESC, b.createdAt DESC
        """)
    List<DesktopBroadcast> findUnreadForUser(@Param("userId") UUID userId, @Param("now") Instant now);

    List<DesktopBroadcast> findTop50ByOrderByCreatedAtDesc();
}
