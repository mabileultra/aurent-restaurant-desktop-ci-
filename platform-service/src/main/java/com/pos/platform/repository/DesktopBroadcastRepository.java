package com.pos.platform.repository;

import com.pos.platform.entity.DesktopBroadcast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface DesktopBroadcastRepository extends JpaRepository<DesktopBroadcast, UUID> {

    @Query("""
        SELECT DISTINCT b FROM DesktopBroadcast b
        WHERE (b.expiresAt IS NULL OR b.expiresAt > :now)
          AND (
            b.status = com.pos.platform.entity.DesktopBroadcastStatus.ACTIVE
            OR (
              b.status = com.pos.platform.entity.DesktopBroadcastStatus.SCHEDULED
              AND b.scheduledAt IS NOT NULL
              AND b.scheduledAt <= :now
            )
          )
          AND (b.scheduledAt IS NULL OR b.scheduledAt <= :now)
          AND (
            b.targetType = com.pos.platform.entity.DesktopBroadcastTargetType.ALL
            OR (
              b.targetType = com.pos.platform.entity.DesktopBroadcastTargetType.COMPANIES
              AND :companyId IS NOT NULL
              AND :companyId MEMBER OF b.companyIds
            )
            OR (
              b.targetType = com.pos.platform.entity.DesktopBroadcastTargetType.STORES
              AND :hasStores = TRUE
              AND EXISTS (
                SELECT 1 FROM b.storeIds sid WHERE sid IN :storeIds
              )
            )
          )
          AND b.id NOT IN (
            SELECT r.id.broadcastId FROM DesktopBroadcastRead r WHERE r.id.userId = :userId
          )
        ORDER BY b.priority DESC, b.createdAt DESC
        """)
    List<DesktopBroadcast> findUnreadForUser(
        @Param("userId") UUID userId,
        @Param("companyId") Integer companyId,
        @Param("storeIds") Collection<Integer> storeIds,
        @Param("hasStores") boolean hasStores,
        @Param("now") Instant now
    );

    List<DesktopBroadcast> findTop50ByOrderByCreatedAtDesc();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE DesktopBroadcast b
        SET b.status = com.pos.platform.entity.DesktopBroadcastStatus.ACTIVE
        WHERE b.status = com.pos.platform.entity.DesktopBroadcastStatus.SCHEDULED
          AND b.scheduledAt IS NOT NULL
          AND b.scheduledAt <= :now
          AND (b.expiresAt IS NULL OR b.expiresAt > :now)
        """)
    int activateDueBroadcasts(@Param("now") Instant now);
}
